// scripts/init_available_balance.js
// Run this script once to initialize availableBalance for all users if missing.

const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxhedge');
  const users = await User.find({ availableBalance: { $exists: false } });
  for (const user of users) {
    user.availableBalance = 0;
    await user.save();
    console.log(`Initialized availableBalance for user: ${user.email || user._id}`);
  }
  console.log(`Done. Updated ${users.length} users.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
