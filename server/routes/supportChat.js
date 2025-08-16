const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('[supportChat] sharp not available; thumbnails will be disabled. Error:', err && err.message);
  sharp = null;
}

module.exports = (io) => {
// In-memory message store (replace with DB in production)
let messages = [];

// File upload setup
const upload = multer({
  dest: path.join(__dirname, '../uploads/support'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../uploads/support');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Get all messages
router.get('/messages', (req, res) => {
  try {
    const BASE = process.env.API_URL || (req.protocol + '://' + req.get('host')) || 'https://api.luxyield.com';
    const normalized = messages.map(m => {
      const copy = { ...m };
      if (copy.attachment) {
        // If attachment contains a path, extract filename
        const parts = copy.attachment.split('/');
        const filename = parts.length ? parts[parts.length - 1] : copy.attachment;
        copy.attachment = `${BASE}/uploads/support/${filename}`;
      }
      return copy;
    });
    res.json(normalized);
  } catch (err) {
    console.error('Error serving messages:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/message', async (req, res) => {
  const { sender, userId, content, type, timestamp, attachment, name, username } = req.body;
  // Normalize attachment to just filename if full path provided
  let normalizedAttachment = attachment;
  if (attachment && attachment.includes('/')) {
    const parts = attachment.split('/');
    normalizedAttachment = parts[parts.length - 1];
  }
  let msg = { sender, content, type, timestamp, attachment: normalizedAttachment, status: 'sent' };

  // If message is from user, ensure name, username, and avatar are included
  if (sender === 'user' && userId) {
    let userName = name;
    let userUsername = username;
    let userAvatar = null;
    try {
      // Only fetch if missing or 'Unknown'
      if (!userName || userName === 'Unknown' || !userUsername || userUsername === 'unknown') {
        const user = await User.findById(userId).lean();
        if (user) {
          userName = user.name;
          userUsername = user.username || user.email;
          userAvatar = user.avatar || null;
        }
      }
    } catch (e) { /* ignore */ }
    msg.userId = userId;
    msg.name = userName || 'Unknown';
    msg.username = userUsername || 'unknown';
    msg.avatar = userAvatar || null;
  } else if (userId) {
    msg.userId = userId;
    if (name) msg.name = name;
    if (username) msg.username = username;
  }
  messages.push(msg);
  if (io) {
    if (sender === 'user' && userId) {
      // Send ONLY to all admins (not to the user)
      io.to('admins').emit('newMessage', msg);
    } else if (sender === 'support' && userId) {
      // Send ONLY to the user (not to all admins)
      io.to(userId).emit('newMessage', msg);
      // Emit a notification event for the user
      io.to(userId).emit('supportNotification', {
        title: 'New Support Message',
        message: msg.content,
        from: 'Support',
        timestamp: msg.timestamp,
        chatId: userId // or another unique chat identifier
      });
    } else {
      io.emit('newMessage', msg);
    }
  }
  res.json({ success: true, message: msg });
});

// Mark messages as seen
router.post('/message-seen', (req, res) => {
  const { userId, sender } = req.body;
  // Mark all messages from the other party as 'seen'
  messages = messages.map(m => {
    if (sender === 'user' && m.sender === 'support' && m.userId === userId && m.status !== 'seen') {
      return { ...m, status: 'seen' };
    }
    if (sender === 'support' && m.sender === 'user' && m.userId === userId && m.status !== 'seen') {
      return { ...m, status: 'seen' };
    }
    return m;
  });
  if (io) {
    io.emit('messagesSeen', { userId, sender });
  }
  res.json({ success: true });
});

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = path.join(__dirname, '../uploads/support', req.file.filename);
  const ext = path.extname(req.file.originalname).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  let thumbnailUrl = null;
  // Generate thumbnail if image
  if (isImage && sharp) {
    const thumbName = req.file.filename + '_thumb.jpg';
    const thumbPath = path.join(__dirname, '../uploads/support', thumbName);
    try {
      await sharp(filePath)
        .resize(200, 200, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      thumbnailUrl = `/uploads/support/${thumbName}`;
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
    }
  } else if (isImage && !sharp) {
    // sharp not available: skip thumbnail generation but continue
    console.warn('[supportChat] skipping thumbnail generation because sharp is not installed');
  }
  // Check if file exists before returning URL
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(500).json({ error: 'File not found after upload' });
    }
    const fileUrl = `/uploads/support/${req.file.filename}`;
    res.json({ fileUrl, thumbnailUrl, originalName: req.file.originalname });
  });
});

// Admin: clear chat (for demo)
router.post('/clear', (req, res) => {
  messages = [];
  res.json({ success: true });
});

// Socket.IO typing events
router.post('/message', async (req, res) => {
  const { sender, userId, content, type, timestamp, attachment, name, username } = req.body;
  let msg = { sender, content, type, timestamp, attachment };

  // If message is from user, ensure name and username are included
  if (sender === 'user' && userId) {
    let userName = name;
    let userUsername = username;
    try {
      // Only fetch if missing or 'Unknown'
      if (!userName || userName === 'Unknown' || !userUsername || userUsername === 'unknown') {
        const user = await User.findById(userId).lean();
        if (user) {
          userName = user.name;
          userUsername = user.username || user.email;
        }
      }
    } catch (e) { /* ignore */ }
    msg.userId = userId;
    msg.name = userName || 'Unknown';
    msg.username = userUsername || 'unknown';
  } else if (userId) {
    msg.userId = userId;
    if (name) msg.name = name;
    if (username) msg.username = username;
  }
  messages.push(msg);
  if (io) {
    // Notify all clients (user and admin)
    io.emit('newMessage', msg);
  }
  res.json({ success: true, message: msg });
});

// Typing events
if (io) {
  io.on('connection', (socket) => {
    socket.on('adminTyping', ({ userId }) => {
      io.to(userId).emit('adminTyping', { userId });
    });
    socket.on('adminStopTyping', ({ userId }) => {
      io.to(userId).emit('adminStopTyping', { userId });
    });
    socket.on('endSupportSession', ({ userId }) => {
      console.log('Backend received endSupportSession for user:', userId);
      io.to(userId).emit('endSupportSession');
    });
  });
}

return router;
};
