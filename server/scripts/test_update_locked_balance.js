// server/scripts/test_update_locked_balance.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
const userId = '6884336eb48a3ee02f74bdb9'; // Replace with your userId
const newLockedBalance = 1234.56; // Set to desired test value

async function run() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  user.lockedBalance = newLockedBalance;
  await user.save();
  console.log('Updated lockedBalance:', user.lockedBalance);
  await mongoose.disconnect();
}

run();
