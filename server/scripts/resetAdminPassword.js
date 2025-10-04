// resetAdminPassword.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@thedigitaltrading.com';
    const newPassword = 'Admin@123';

    // Find admin user
    const admin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Current admin user details:');
    console.log('- Email:', admin.email);
    console.log('- Name:', admin.name);
    console.log('- Role:', admin.role);
    console.log('- Status:', admin.status);

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    admin.password = hashedPassword;
    
    await admin.save();
    console.log('\nAdmin password has been reset to:', newPassword);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

resetAdminPassword();