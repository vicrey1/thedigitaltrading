// Usage: node scripts/verifyDepositBalance.js <userEmail>
const mongoose = require('mongoose');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
require('dotenv').config({ path: __dirname + '/../.env' });

async function main() {
  const email = process.argv[2];
  if (!email) return console.error('Usage: node scripts/verifyDepositBalance.js <userEmail>');
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) return console.error('User not found');
  const deposits = await Deposit.find({ user: user._id, status: 'confirmed' });
  const sum = deposits.reduce((acc, d) => acc + d.amount, 0);
  console.log('User:', user.email);
  console.log('User.depositBalance:', user.depositBalance);
  console.log('Sum of confirmed deposits:', sum);
  if (user.depositBalance === sum) {
    console.log('✅ depositBalance matches sum of confirmed deposits');
  } else {
    console.log('❌ depositBalance does NOT match sum of confirmed deposits');
  }
  process.exit();
}
main();
