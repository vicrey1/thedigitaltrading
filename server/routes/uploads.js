const express = require('express');
const path = require('path');
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// Serve KYC uploads only to authenticated admins
router.get('/kyc/:filename', auth, (req, res, next) => {
  console.log('Decoded token for KYC file:', req.user);
  next();
}, authAdmin, (req, res) => {
  const filePath = path.join(__dirname, '../uploads/kyc', req.params.filename);
  res.sendFile(filePath, err => {
    if (err) {
      console.error('KYC file error:', err, 'File:', filePath);
      res.status(404).send('File not found');
    } else {
      console.log('KYC file served:', filePath, 'to admin:', req.user.id);
    }
  });
});

// Serve support uploads as static files
router.use('/support', express.static(path.join(__dirname, '../uploads/support')));

module.exports = router;
