const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const SupportUpload = require('../models/SupportUpload');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('[supportChat] sharp not available; thumbnails will be disabled. Error:', err && err.message);
  sharp = null;
}

// Multer config: accept files into memory for direct S3 upload or disk fallback
const MAX_FILE_SIZE = parseInt(process.env.SUPPORT_MAX_FILE_SIZE || (10 * 1024 * 1024)); // 10MB default
const ALLOWED_MIMES = (process.env.SUPPORT_ALLOWED_MIMES && process.env.SUPPORT_ALLOWED_MIMES.split(',')) || ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

// S3 client if env provided
let s3Client = null;
if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
}

// Helper: upload buffer to S3 and return key + url
async function uploadBufferToS3(buffer, key, contentType) {
  if (!s3Client) throw new Error('S3 not configured');
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }
  });
  await parallelUploads3.done();
  // Return signed URL valid for 7 days
  const cmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  const url = await getSignedUrl(s3Client, cmd, { expiresIn: 60 * 60 * 24 * 7 });
  return { key, url };
}

// SSE endpoint for upload progress notifications (admins/users can subscribe)
router.get('/upload-progress/:clientId', authMiddleware, (req, res) => {
  const clientId = req.params.clientId;
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Keep connection alive
  const keepAlive = setInterval(() => res.write(':keep-alive\n\n'), 15000);
  // Listen for progress events on process-wide emitter
  const onProgress = (payload) => {
    if (payload.clientId === clientId) send(payload);
  };
  globalThis.supportUploadProgressEmitter = globalThis.supportUploadProgressEmitter || require('events').EventEmitter.prototype;
  // Using simple process-level emitter map
  globalThis.__supportEmitter = globalThis.__supportEmitter || new (require('events')).EventEmitter();
  globalThis.__supportEmitter.on('progress', onProgress);

  req.on('close', () => {
    clearInterval(keepAlive);
    globalThis.__supportEmitter.off('progress', onProgress);
  });
});

// In-memory message store (replace with DB in production)
let messages = [];

// Get all messages
router.get('/messages', (req, res) => {
  try {
    const BASE = process.env.API_URL || (req.protocol + '://' + req.get('host')) || 'https://api.luxyield.com';
    const normalized = messages.map(m => {
      const copy = { ...m };
      if (copy.attachment) {
        // If attachment is an object with file/thumb
        if (typeof copy.attachment === 'object') {
          const att = { ...copy.attachment };
          if (att.file && !att.file.startsWith('http')) {
            const parts = att.file.split('/');
            const filename = parts.length ? parts[parts.length - 1] : att.file;
            att.file = `${BASE}/api/support/file/${filename}`;
          }
          if (att.thumb && !att.thumb.startsWith('http')) {
            const parts = att.thumb.split('/');
            const filename = parts.length ? parts[parts.length - 1] : att.thumb;
            att.thumb = `${BASE}/api/support/file/${filename}`;
          }
          copy.attachment = att;
        } else if (typeof copy.attachment === 'string') {
          // If attachment contains a path, extract filename
          if (copy.attachment.startsWith('http')) {
            // already a full URL
          } else {
            const parts = copy.attachment.split('/');
            const filename = parts.length ? parts[parts.length - 1] : copy.attachment;
            copy.attachment = `${BASE}/api/support/file/${filename}`;
          }
        }
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

// Upload a file (require auth to track owner)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Validate size & mime already handled by multer
  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  const baseName = Date.now() + '-' + Math.round(Math.random()*1e9) + '-' + originalName.replace(/\s+/g, '_');

  let s3Key = null;
  let fileUrl = null;
  let thumbUrl = null;

  try {
    if (s3Client) {
      // Upload original file to S3
      const key = `support/${baseName}`;
      // Emit start
      globalThis.__supportEmitter && globalThis.__supportEmitter.emit('progress', { clientId: req.user && req.user.id, status: 'started', filename: key });
      await uploadBufferToS3(fileBuffer, key, req.file.mimetype);
      s3Key = key;
      // Generate URL via presigner
      const getCmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
      fileUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 60 * 60 * 24 * 7 });

      // Generate thumbnail & upload to S3 (if image and sharp available)
      if (isImage && sharp) {
        const thumbBuf = await sharp(fileBuffer).resize(200, 200, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
        const thumbKey = `support/${baseName}_thumb.jpg`;
        await uploadBufferToS3(thumbBuf, thumbKey, 'image/jpeg');
        thumbUrl = (await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: thumbKey }), { expiresIn: 60*60*24*7 }));
      }

    } else {
      // Fallback to disk
      const filename = baseName;
      const filePath = path.join(__dirname, '../uploads/support', filename);
      await fs.promises.writeFile(filePath, fileBuffer);
      fileUrl = `${process.env.API_URL || (req.protocol + '://' + req.get('host'))}/api/support/file/${filename}`;
      if (isImage && sharp) {
        const thumbPath = path.join(__dirname, '../uploads/support', filename + '_thumb.jpg');
        await sharp(filePath).resize(200,200,{fit:'inside'}).jpeg({quality:80}).toFile(thumbPath);
        thumbUrl = `${process.env.API_URL || (req.protocol + '://' + req.get('host'))}/api/support/file/${filename}_thumb.jpg`;
      }
    }

    // Persist ownership metadata in DB
    try {
      const ownerId = req.user && req.user.id ? req.user.id : null;
      await SupportUpload.create({ filename: s3Key || baseName, originalName, userId: ownerId, storage: s3Client ? 's3' : 'disk' });
    } catch (e) {
      console.warn('Failed to persist upload metadata:', e && e.message);
    }

    // Emit done
    globalThis.__supportEmitter && globalThis.__supportEmitter.emit('progress', { clientId: req.user && req.user.id, status: 'done', filename: s3Key || baseName });

    return res.json({ fileUrl, thumbnailUrl: thumbUrl, originalName });
  } catch (err) {
    console.error('Upload error:', err && (err.stack || err.message || err));
    globalThis.__supportEmitter && globalThis.__supportEmitter.emit('progress', { clientId: req.user && req.user.id, status: 'error', filename: baseName, error: err.message });
    return res.status(500).json({ error: 'Upload failed', message: err.message });
  }
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

// Serve support files with auth and ownership check
router.get('/file/:filename', authMiddleware, async (req, res) => {
  const filename = req.params.filename;
  // If filename includes 'support/' treat as S3 key; else may be disk
  try {
    const record = await SupportUpload.findOne({ filename }).lean();
    const userId = req.user && req.user.id;
    const isAdmin = req.user && req.user.role && req.user.role.toLowerCase() === 'admin';
    if (!isAdmin) {
      if (!record || !record.userId) return res.status(403).send('Forbidden');
      if (String(record.userId) !== String(userId)) return res.status(403).send('Forbidden');
    }

    if (record && record.storage === 's3' && s3Client) {
      const key = record.filename;
      const cmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
      const url = await getSignedUrl(s3Client, cmd, { expiresIn: 60 }); // short-lived
      return res.redirect(url);
    }

    // Fallback to disk
    const filePath = path.join(__dirname, '../uploads/support', filename);
    await fs.promises.access(filePath, fs.constants.F_OK);
    return res.sendFile(filePath);
  } catch (e) {
    console.error('Error serving file:', e && e.message);
    return res.status(404).send('Not found');
  }
});

module.exports = (io) => {
return router;
};
