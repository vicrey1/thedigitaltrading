const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');

// Models
const SupportTicket = require('../../models/SupportTicket');
const SupportMessage = require('../../models/SupportMessage');
const SupportAttachment = require('../../models/SupportAttachment');
const SupportAgent = require('../../models/SupportAgent');
const User = require('../../models/User');

// Middleware
const auth = require('../../middleware/auth');
const authAdmin = require('../../middleware/authAdmin');

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

// ============ ADMIN DASHBOARD & ANALYTICS ============

// Get support dashboard overview
router.get('/dashboard', auth, authAdmin, async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const days = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get ticket analytics
    const ticketAnalytics = await SupportTicket.getAnalytics({
      startDate,
      endDate: new Date()
    });

    // Get message stats
    const messageStats = await SupportMessage.getMessageStats({
      startDate,
      endDate: new Date()
    });

    // Get team stats
    const teamStats = await SupportAgent.getTeamStats();

    // Get recent tickets
    const recentTickets = await SupportTicket.find({
      isDeleted: false,
      createdAt: { $gte: startDate }
    })
    .populate('userId', 'name email username')
    .populate('assignedAgent', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get unassigned tickets count
    const unassignedCount = await SupportTicket.countDocuments({
      assignedAgent: null,
      status: { $in: ['open', 'in_progress'] },
      isDeleted: false
    });

    // Get overdue tickets (open for more than 24 hours)
    const overdueDate = new Date();
    overdueDate.setHours(overdueDate.getHours() - 24);
    
    const overdueCount = await SupportTicket.countDocuments({
      status: { $in: ['open', 'in_progress'] },
      createdAt: { $lt: overdueDate },
      isDeleted: false
    });

    res.json({
      success: true,
      dashboard: {
        analytics: {
          tickets: ticketAnalytics[0] || {},
          messages: messageStats[0] || {},
          team: teamStats[0] || {}
        },
        metrics: {
          unassignedTickets: unassignedCount,
          overdueTickets: overdueCount
        },
        recentTickets
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

// ============ TICKET MANAGEMENT ============

// Get all tickets with filtering and pagination
router.get('/tickets', auth, authAdmin, async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignedAgent,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isDeleted: false };
    
    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedAgent) {
      query.assignedAgent = assignedAgent === 'unassigned' ? null : assignedAgent;
    }
    
    // Apply search
    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email username')
      .populate('assignedAgent', 'name email')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalTickets = await SupportTicket.countDocuments(query);

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
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch tickets',
      details: error.message
    });
  }
});

// Get specific ticket details (admin view)
router.get('/tickets/:ticketId', 
  authAdmin,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;

      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        isDeleted: false
      })
      .populate('userId', 'name email username phone createdAt')
      .populate('assignedAgent', 'name email');

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Get all messages including internal notes
      const messages = await SupportMessage.getMessagesByTicket(ticketId, {
        includeInternal: true
      });

      // Get ticket attachments
      const attachments = await SupportAttachment.getAttachmentsByTicket(ticketId);

      res.json({
        success: true,
        ticket,
        messages,
        attachments
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

// Assign ticket to agent
router.post('/tickets/:ticketId/assign',
  authAdmin,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  body('agentId').isMongoId().withMessage('Invalid agent ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { agentId } = req.body;

      // Verify agent exists and is available
      const agent = await SupportAgent.findById(agentId);
      if (!agent || !agent.isActive) {
        return res.status(400).json({
          error: 'Agent not found or inactive'
        });
      }

      // Check if agent can handle more tickets
      if (!agent.canHandleMoreTickets()) {
        return res.status(400).json({
          error: 'Agent has reached maximum ticket capacity'
        });
      }

      // Assign ticket
      const ticket = await SupportTicket.assignToAgent(ticketId, agentId);
      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Update agent ticket count
      await SupportAgent.assignTicket(agentId, ticketId);

      // Create system message
      const systemMessage = new SupportMessage({
        ticketId,
        senderId: req.user.id,
        senderType: 'system',
        content: `Ticket assigned to ${agent.userId.name || 'Agent'}`,
        messageType: 'system_notification',
        metadata: {
          isInternal: true
        }
      });
      await systemMessage.save();

      res.json({
        success: true,
        ticket,
        message: 'Ticket assigned successfully'
      });

    } catch (error) {
      console.error('Error assigning ticket:', error);
      res.status(500).json({
        error: 'Failed to assign ticket',
        details: error.message
      });
    }
  }
);

// Update ticket status
router.patch('/tickets/:ticketId/status',
  authAdmin,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  body('status').isIn(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { status, reason } = req.body;

      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true }
      ).populate('userId assignedAgent', 'name email');

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Create system message
      const systemMessage = new SupportMessage({
        ticketId,
        senderId: req.user.id,
        senderType: 'system',
        content: `Ticket status changed to ${status}${reason ? `. Reason: ${reason}` : ''}`,
        messageType: 'status_update',
        metadata: {
          isInternal: true
        }
      });
      await systemMessage.save();

      // Update agent performance if ticket was resolved
      if (status === 'resolved' && ticket.assignedAgent) {
        await SupportAgent.updatePerformanceMetrics(ticket.assignedAgent, {
          ticketResolved: true,
          resolutionTime: ticket.metrics.resolutionTime
        });
      }

      res.json({
        success: true,
        ticket,
        message: 'Ticket status updated successfully'
      });

    } catch (error) {
      console.error('Error updating ticket status:', error);
      res.status(500).json({
        error: 'Failed to update ticket status',
        details: error.message
      });
    }
  }
);

// Send message as agent
router.post('/tickets/:ticketId/messages',
  authAdmin,
  param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
  body('content').trim().isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be boolean'),
  body('templateUsed').optional().isString().withMessage('templateUsed must be string'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { content, isInternal = false, templateUsed } = req.body;

      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      // Create message
      const message = new SupportMessage({
        ticketId,
        senderId: req.user.id,
        senderType: 'agent',
        content,
        messageType: 'text',
        metadata: {
          isInternal,
          templateUsed,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });

      await message.save();

      // Update ticket status if it was open
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
        await ticket.save();
      }

      // Populate message for response
      const populatedMessage = await SupportMessage.findById(message._id)
        .populate('senderId', 'name email');

      res.status(201).json({
        success: true,
        message: populatedMessage
      });

    } catch (error) {
      console.error('Error sending agent message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error.message
      });
    }
  }
);

// ============ AGENT MANAGEMENT ============

// Get all agents
router.get('/agents', authAdmin, async (req, res) => {
  try {
    const { status, specialization, isActive } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (specialization) query.specializations = specialization;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const agents = await SupportAgent.find(query)
      .populate('userId', 'name email username')
      .sort({ lastActiveAt: -1 });

    res.json({
      success: true,
      agents
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      error: 'Failed to fetch agents',
      details: error.message
    });
  }
});

// Create new agent
router.post('/agents',
  authAdmin,
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('specializations').isArray().withMessage('Specializations must be an array'),
  body('maxConcurrentTickets').optional().isInt({ min: 1, max: 50 })
    .withMessage('Max concurrent tickets must be between 1 and 50'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, specializations, maxConcurrentTickets = 10 } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          error: 'User not found'
        });
      }

      // Check if agent already exists
      const existingAgent = await SupportAgent.findOne({ userId });
      if (existingAgent) {
        return res.status(400).json({
          error: 'User is already a support agent'
        });
      }

      const agent = new SupportAgent({
        userId,
        specializations,
        availability: {
          maxConcurrentTickets
        }
      });

      await agent.save();

      const populatedAgent = await SupportAgent.findById(agent._id)
        .populate('userId', 'name email username');

      res.status(201).json({
        success: true,
        agent: populatedAgent,
        message: 'Support agent created successfully'
      });

    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({
        error: 'Failed to create agent',
        details: error.message
      });
    }
  }
);

// Update agent
router.patch('/agents/:agentId',
  authAdmin,
  param('agentId').isMongoId().withMessage('Invalid agent ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { agentId } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updates.userId;
      delete updates.agentId;
      delete updates.performance;
      delete updates.sessions;

      const agent = await SupportAgent.findByIdAndUpdate(
        agentId,
        updates,
        { new: true, runValidators: true }
      ).populate('userId', 'name email username');

      if (!agent) {
        return res.status(404).json({
          error: 'Agent not found'
        });
      }

      res.json({
        success: true,
        agent,
        message: 'Agent updated successfully'
      });

    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(500).json({
        error: 'Failed to update agent',
        details: error.message
      });
    }
  }
);

// Get agent performance stats
router.get('/agents/:agentId/stats',
  authAdmin,
  param('agentId').isMongoId().withMessage('Invalid agent ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { agentId } = req.params;
      const { dateRange = '30' } = req.query;

      const stats = await SupportAgent.getAgentStats(agentId, {
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      if (!stats) {
        return res.status(404).json({
          error: 'Agent not found'
        });
      }

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error fetching agent stats:', error);
      res.status(500).json({
        error: 'Failed to fetch agent stats',
        details: error.message
      });
    }
  }
);

// ============ BULK OPERATIONS ============

// Bulk assign tickets
router.post('/tickets/bulk-assign',
  authAdmin,
  body('ticketIds').isArray().withMessage('Ticket IDs must be an array'),
  body('agentId').isMongoId().withMessage('Invalid agent ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ticketIds, agentId } = req.body;

      // Verify agent
      const agent = await SupportAgent.findById(agentId);
      if (!agent || !agent.isActive) {
        return res.status(400).json({
          error: 'Agent not found or inactive'
        });
      }

      const results = [];
      for (const ticketId of ticketIds) {
        try {
          const ticket = await SupportTicket.assignToAgent(ticketId, agentId);
          if (ticket) {
            await SupportAgent.assignTicket(agentId, ticketId);
            results.push({ ticketId, success: true });
          } else {
            results.push({ ticketId, success: false, error: 'Ticket not found' });
          }
        } catch (error) {
          results.push({ ticketId, success: false, error: error.message });
        }
      }

      res.json({
        success: true,
        results,
        message: 'Bulk assignment completed'
      });

    } catch (error) {
      console.error('Error in bulk assign:', error);
      res.status(500).json({
        error: 'Failed to bulk assign tickets',
        details: error.message
      });
    }
  }
);

// ============ SEARCH & FILTERS ============

// Search tickets
router.get('/search/tickets',
  authAdmin,
  query('q').isLength({ min: 1 }).withMessage('Search query is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;

      const tickets = await SupportTicket.find({
        isDeleted: false,
        $or: [
          { ticketId: { $regex: q, $options: 'i' } },
          { subject: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
      .populate('userId', 'name email username')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

      res.json({
        success: true,
        tickets,
        query: q
      });

    } catch (error) {
      console.error('Error searching tickets:', error);
      res.status(500).json({
        error: 'Failed to search tickets',
        details: error.message
      });
    }
  }
);

module.exports = router;