// scripts/print_balances.js
// Print all users' availableBalance and lockedBalance for verification.

const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxhedge');
  const users = await User.find();
  for (const user of users) {
    console.log(`User: ${user.email || user._id}\n  Available: ${user.availableBalance}  Locked: ${user.lockedBalance}`);
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Balance print error:', err);
  process.exit(1);
});
