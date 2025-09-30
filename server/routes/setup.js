const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// One-time setup route for admin
router.post('/setup-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@thedigitaltrading.com';
    const adminPassword = 'StrongPassword123';
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update existing admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser.password = hashedPassword;
      await adminUser.save();
      res.json({ message: 'Admin password updated successfully' });
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        username: 'admin',
        phone: '+1234567890',
        country: 'United States',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        role: 'admin',
        isEmailVerified: true,
        referralCode: 'ADMIN' + Date.now()
      });
      
      await adminUser.save();
      res.json({ message: 'Admin user created successfully' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;