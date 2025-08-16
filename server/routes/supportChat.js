const express = require('express');
const router = express.Router();
let io = null; // will be set when module is initialized with io instance
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const SupportUpload = require('../models/SupportUpload');
const { verifyToken, isAdminToken } = require('../middleware/auth');

// Instead of failing at startup when aws-sdk is not installed, attempt to require it lazily
let AWS, s3;
try {
  AWS = require('aws-sdk');
  s3 = new AWS.S3();
  console.log('[SUPPORT_CHAT] aws-sdk loaded, S3 support enabled');
} catch (err) {
  s3 = null;
  console.warn('[SUPPORT_CHAT] aws-sdk not available, S3 support disabled:', err && err.message);
}

let S3Client, PutObjectCommand, GetObjectCommand, Upload, getSignedUrl;
try {
  const s3pkg = require('@aws-sdk/client-s3');
  const libstorage = require('@aws-sdk/lib-storage');
  const presigner = require('@aws-sdk/s3-request-presigner');
  S3Client = s3pkg.S3Client;
  PutObjectCommand = s3pkg.PutObjectCommand;
  GetObjectCommand = s3pkg.GetObjectCommand;
  Upload = libstorage.Upload;
  getSignedUrl = presigner.getSignedUrl;
} catch (e) {
  console.warn('[supportChat] AWS SDK not available; S3 features disabled. Install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner to enable S3 uploads.');
  S3Client = null;
  PutObjectCommand = null;
  GetObjectCommand = null;
  Upload = null;
  getSignedUrl = null;
}

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
  try {
    if (attachment) {
      if (typeof attachment === 'string') {
        if (attachment.includes('/')) {
          const parts = attachment.split('/');
          normalizedAttachment = parts[parts.length - 1];
        }
      } else if (typeof attachment === 'object') {
        // Ensure file/thumb fields are sanitized to filenames when full URLs provided
        const att = { ...attachment };
        if (att.file && typeof att.file === 'string' && att.file.includes('/')) {
          att.file = att.file.split('/').pop();
        }
        if (att.thumb && typeof att.thumb === 'string' && att.thumb.includes('/')) {
          att.thumb = att.thumb.split('/').pop();
        }
        // Also sanitize url/thumbUrl if present to keep full URLs (they may be presigned)
        // Keep url and thumbUrl untouched so clients can use them directly.
        normalizedAttachment = att;
      }
    }
  } catch (e) {
    console.warn('[SUPPORT_MESSAGE] Attachment normalization error:', e && e.message);
    normalizedAttachment = attachment;
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
      // create record for main file
      const mainFilename = s3Key || baseName;
      await SupportUpload.create({ filename: mainFilename, originalName, userId: ownerId, storage: s3Client ? 's3' : 'disk' });
      // create record for thumbnail if present
      if (thumbUrl) {
        const thumbFilename = s3Key ? ("support/" + baseName + '_thumb.jpg') : (baseName + '_thumb.jpg');
        try {
          await SupportUpload.create({ filename: thumbFilename, originalName: originalName + ' (thumb)', userId: ownerId, storage: s3Client ? 's3' : 'disk' });
        } catch (e) {
          // ignore duplicate/thumb creation errors
          console.warn('Failed to persist thumbnail metadata (may already exist):', e && e.message);
        }
      }
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

// Verbose file serving for diagnostics
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const authHeader = req.headers['authorization'] || req.query.authorization || req.query.token || req.body && req.body.token;
    let tokenInfo = null;
    try {
      tokenInfo = await verifyToken(authHeader);
    } catch (err) {
      // If verifyToken throws, log and continue; admin may be using adminToken in query
      console.warn('[FILE-SERVE] verifyToken failed:', err && err.message);
    }

    const adminFallback = req.query.adminToken || req.query.admin_token;
    if (!tokenInfo && adminFallback) {
      try {
        tokenInfo = await isAdminToken(adminFallback);
      } catch (err) {
        console.warn('[FILE-SERVE] adminToken verify failed:', err && err.message);
      }
    }

    console.log('[FILE-SERVE] Request for', filename, 'by', tokenInfo ? tokenInfo.id : 'unauthenticated', 'isAdmin:', tokenInfo ? tokenInfo.isAdmin : false);

    // Try to find record by filename, but support older records that include the `support/` prefix
    const record = await SupportUpload.findOne({ $or: [{ filename }, { filename: `support/${filename}` }] });
    if (!record) {
      console.warn('[FILE-SERVE] No SupportUpload record for', filename);
      return res.status(404).json({ error: 'Not found' });
    }

    console.log('[FILE-SERVE] Found record:', { filename: record.filename, userId: record.userId && record.userId.toString(), storage: record.storage });

    const requesterId = tokenInfo && tokenInfo.id;
    const requesterIsAdmin = tokenInfo && tokenInfo.isAdmin;

    if (!requesterId && !requesterIsAdmin) {
      console.warn('[FILE-SERVE] No authenticated requester');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!requesterIsAdmin && record.userId && record.userId.toString() !== requesterId.toString()) {
      console.warn('[FILE-SERVE] Access denied: requester', requesterId, 'does not match owner', record.userId.toString());
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Serve from S3 or disk depending on record.storage
    if (record.storage === 's3') {
      if (!s3) {
        console.warn('[FILE-SERVE] Record marked s3 but aws-sdk is not available; falling back to disk check for', filename);
        // Try disk fallback in both uploads/support and uploads
        const fallbackPaths = [
          path.join(__dirname, '..', 'uploads', 'support', filename),
          path.join(__dirname, '..', 'uploads', filename)
        ];
        const fallbackExists = fallbackPaths.find(p => fs.existsSync(p));
        if (fallbackExists) {
          console.log('[FILE-SERVE] Serving fallback disk file for', filename, 'from', fallbackExists);
          return res.sendFile(fallbackExists);
        }
        return res.status(503).json({ error: 'Storage temporarily unavailable' });
      }
      // Generate signed URL and redirect
      const params = { Bucket: process.env.S3_BUCKET, Key: filename, Expires: 60 };
      const url = s3.getSignedUrl('getObject', params);
      console.log('[FILE-SERVE] Redirecting to S3 URL for', filename);
      return res.redirect(url);
    }

    // Disk fallback - check both uploads/support and uploads root
    const possiblePaths = [
      path.join(__dirname, '..', 'uploads', 'support', filename),
      path.join(__dirname, '..', 'uploads', filename)
    ];
    const filePath = possiblePaths.find(p => fs.existsSync(p));
    if (!filePath) {
      console.warn('[FILE-SERVE] File missing on disk (checked support/ and uploads/):', possiblePaths);
      return res.status(410).json({ error: 'File missing' });
    }

    console.log('[FILE-SERVE] Streaming file from disk:', filePath);
    res.sendFile(filePath);
  } catch (err) {
    console.error('[FILE-SERVE] Error serving file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// At the very end, assign passed io to local variable and return router
module.exports = (passedIo) => {
  io = passedIo;
  return router;
};
