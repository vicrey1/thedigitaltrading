const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storageAnnouncements = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/announcements'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadAnnouncements = multer({ storage: storageAnnouncements });

router.post('/upload-announcement-image', uploadAnnouncements.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const imageUrl = `/uploads/announcements/${req.file.filename}`;
  res.json({ url: imageUrl });
});

const storageSupport = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/support'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadSupport = multer({ storage: storageSupport });

router.post('/upload-support-file', uploadSupport.single('file'), (req, res) => {
  console.log('Received file upload request');
  if (!req.file) {
    console.error('No file uploaded:', req.body, req.files);
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('File uploaded:', req.file);
  const fileUrl = `/uploads/support/${req.file.filename}`;
  res.json({ url: fileUrl, originalName: req.file.originalname });
});

module.exports = router;
