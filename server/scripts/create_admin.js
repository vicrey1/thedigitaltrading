// scripts/create_admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';
  if (!email || !password) {
    console.error('Usage: node scripts/create_admin.js <email> <password> [name]');
    process.exit(1);
  }
  const existing = await User.findOne({ email });
  if (existing) {
    console.error('Admin with this email already exists.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const admin = new User({
    name,
    email,
    username: email.split('@')[0],
    phone: '+10000000000',
    country: 'Admin',
    securityQuestion: 'What is your admin code?',
    securityAnswer: 'admin',
    password: hash,
    role: 'admin',
    tier: 'Diamond', // Changed from 'VIP' to 'Diamond' to match allowed values
    isEmailVerified: true,
    referralCode: 'ADMIN' + Date.now() // Ensure unique referral code
  });
  await admin.save();
  console.log('Admin created:', admin.email);
  process.exit(0);
}

createAdmin();
