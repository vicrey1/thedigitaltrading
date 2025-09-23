// scripts/reset_admin_password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function resetAdminPassword() {
  await mongoose.connect(MONGO_URI);
  
  const email = process.argv[2] || 'admin@thedigitaltrading.com';
  const newPassword = process.argv[3] || 'admin123';
  
  console.log(`Resetting password for admin: ${email}`);
  
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    console.error('Admin user not found with email:', email);
    process.exit(1);
  }
  
  const hash = await bcrypt.hash(newPassword, 10);
  admin.password = hash;
  await admin.save();
  
  console.log(`Admin password reset successfully for: ${email}`);
  console.log(`New password: ${newPassword}`);
  process.exit(0);
}

resetAdminPassword().catch(console.error);