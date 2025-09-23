const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');

// Models
const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const SupportAttachment = require('../models/SupportAttachment');
const SupportAgent = require('../models/SupportAgent');
const User = require('../models/User');

// Middleware
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');

// Rate limiting
const createTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 ticket creations per windowMs
  message: { error: 'Too many tickets created. Please try again later.' }
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 messages per minute
  message: { error: 'Too many messages sent. Please slow down.' }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/support');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `support-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Validation middleware
const validateTicketCreation = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['technical', 'billing', 'account', 'general', 'investment', 'withdrawal'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
];

const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'image'])
    .withMessage('Invalid message type')
];

// Helper functions
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const processImageAttachment = async (file) => {
  try {
    const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '_thumb$1');
    
    await sharp(file.path)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return null;
  }
};

// Routes

// ============ USER ROUTES ============

// Create new support ticket
router.post('/tickets', 
  auth, 
  createTicketLimiter,
  upload.array('attachments', 5),
  validateTicketCreation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { subject, description, category, priority = 'medium' } = req.body;
      const userId = req.user.id;

      // Create ticket
      const ticket = new SupportTicket({
        userId,
        subject,
        description,
        category,
        priority,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          platform: req.get('X-Platform') || 'web',
          source: 'web'
        }
      });

      await ticket.save();

      // Create initial message
      const initialMessage = new SupportMessage({
        ticketId: ticket._id,
        senderId: userId,
        senderType: 'user',
        content: description,
        messageType: 'text',
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          platform: req.get('X-Platform') || 'web'
        }
      });

      // Handle file attachments
      if (req.files && req.files.length > 0) {
        const attachments = [];
        
        for (const file of req.files) {
          let thumbnailUrl = null;
          
          // Create thumbnail for images
          if (file.mimetype.startsWith('image/')) {
            thumbnailUrl = await processImageAttachment(file);
          }

          const attachment = new SupportAttachment({
            ticketId: ticket._id,
            messageId: initialMessage._id,
            uploadedBy: userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/support/${file.filename}`,
            thumbnailUrl: thumbnailUrl ? `/uploads/support/${path.basename(thumbnailUrl)}` : null
          });

          await attachment.save();
          
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: attachment.url
          });
        }

        initialMessage.attachments = attachments;
        initialMessage.messageType = 'file';
      }

      await initialMessage.save();

      // Populate ticket for response
      const populatedTicket = await SupportTicket.findById(ticket._id)
        .populate('userId', 'name email username')
        .populate('assignedAgent', 'name email');

      res.status(201).json({
        success: true,
        ticket: populatedTicket,
        message: 'Support ticket created successfully'
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        error: 'Failed to create support ticket',
        details: error.message
      });
    }
  }
);

// Get user's tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const tickets = await SupportTicket.getTicketsByUser(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const totalTickets = await SupportTicket.countDocuments({
      userId,
      isDeleted: false,
      ...(status && { status })
    });

    res.json({
      success: true,
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTickets / parseInt(limit)),
        totalTickets,
        hasNext: parseInt(page) * parseInt(limit) < totalTickets,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch tickets',
      details: error.message
    });
  }
});

// Get specific ticket details
router.get('/tickets/:ticketId', 
  auth,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user.id;

      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
        isDeleted: false
      })
      .populate('userId', 'name email username')
      .populate('assignedAgent', 'name email');

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Get ticket messages
      const messages = await SupportMessage.getMessagesByTicket(ticketId, {
        includeInternal: false
      });

      // Mark messages as read
      await SupportMessage.markTicketMessagesAsRead(ticketId, userId);

      res.json({
        success: true,
        ticket,
        messages
      });

    } catch (error) {
      console.error('Error fetching ticket details:', error);
      res.status(500).json({
        error: 'Failed to fetch ticket details',
        details: error.message
      });
    }
  }
);

// Send message to ticket
router.post('/tickets/:ticketId/messages',
  auth,
  messageLimiter,
  upload.array('attachments', 5),
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  validateMessage,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { content, messageType = 'text' } = req.body;
      const userId = req.user.id;

      // Verify ticket ownership
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
        isDeleted: false
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Check if ticket is closed
      if (ticket.status === 'closed') {
        return res.status(400).json({
          error: 'Cannot send messages to closed tickets'
        });
      }

      // Create message
      const message = new SupportMessage({
        ticketId,
        senderId: userId,
        senderType: 'user',
        content,
        messageType,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          platform: req.get('X-Platform') || 'web'
        }
      });

      // Handle file attachments
      if (req.files && req.files.length > 0) {
        const attachments = [];
        
        for (const file of req.files) {
          let thumbnailUrl = null;
          
          if (file.mimetype.startsWith('image/')) {
            thumbnailUrl = await processImageAttachment(file);
          }

          const attachment = new SupportAttachment({
            ticketId,
            messageId: message._id,
            uploadedBy: userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/support/${file.filename}`,
            thumbnailUrl: thumbnailUrl ? `/uploads/support/${path.basename(thumbnailUrl)}` : null
          });

          await attachment.save();
          
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: attachment.url
          });
        }

        message.attachments = attachments;
        message.messageType = 'file';
      }

      await message.save();

      // Update ticket status if it was waiting for customer
      if (ticket.status === 'waiting_customer') {
        ticket.status = 'in_progress';
        await ticket.save();
      }

      // Populate message for response
      const populatedMessage = await SupportMessage.findById(message._id)
        .populate('senderId', 'name email username');

      res.status(201).json({
        success: true,
        message: populatedMessage
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error.message
      });
    }
  }
);

// Rate ticket satisfaction
router.post('/tickets/:ticketId/satisfaction',
  auth,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { rating, feedback } = req.body;
      const userId = req.user.id;

      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
        isDeleted: false,
        status: { $in: ['resolved', 'closed'] }
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found or not eligible for rating'
        });
      }

      if (ticket.satisfaction.rating) {
        return res.status(400).json({
          error: 'Ticket has already been rated'
        });
      }

      await ticket.addSatisfactionRating(rating, feedback);

      // Update agent performance if ticket was assigned
      if (ticket.assignedAgent) {
        await SupportAgent.updatePerformanceMetrics(ticket.assignedAgent, {
          satisfactionRating: rating
        });
      }

      res.json({
        success: true,
        message: 'Thank you for your feedback'
      });

    } catch (error) {
      console.error('Error rating ticket:', error);
      res.status(500).json({
        error: 'Failed to submit rating',
        details: error.message
      });
    }
  }
);

// Get ticket attachments
router.get('/tickets/:ticketId/attachments',
  auth,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user.id;

      // Verify ticket ownership
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
        isDeleted: false
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      const attachments = await SupportAttachment.getAttachmentsByTicket(ticketId);

      res.json({
        success: true,
        attachments
      });

    } catch (error) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({
        error: 'Failed to fetch attachments',
        details: error.message
      });
    }
  }
);

// Download attachment
router.get('/attachments/:attachmentId/download',
  auth,
  param('attachmentId').isMongoId().withMessage('Invalid attachment ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { attachmentId } = req.params;
      const userId = req.user.id;

      const attachment = await SupportAttachment.findById(attachmentId)
        .populate('ticketId', 'userId');

      if (!attachment || attachment.isDeleted) {
        return res.status(404).json({
          error: 'Attachment not found'
        });
      }

      // Check if user has access to this attachment
      if (!attachment.isAccessibleBy(userId) && 
          attachment.ticketId.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Check if attachment is expired
      if (attachment.isExpired) {
        return res.status(410).json({
          error: 'Attachment has expired'
        });
      }

      const filePath = path.join(__dirname, '../uploads/support', attachment.filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          error: 'File not found on server'
        });
      }

      // Increment download count
      await attachment.incrementDownloadCount();

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      res.setHeader('Content-Type', attachment.mimeType);

      // Send file
      res.sendFile(filePath);

    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({
        error: 'Failed to download attachment',
        details: error.message
      });
    }
  }
);

module.exports = router;