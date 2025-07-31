// scripts/fix_invalid_tiers.js
// Run this script to fix any users with an invalid tier value.

const mongoose = require('mongoose');
const User = require('../models/User');

const VALID_TIERS = ['Starter', 'Silver', 'Gold', 'Platinum', 'Diamond'];

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxhedge');
  const users = await User.find({ tier: { $nin: VALID_TIERS } });
  for (const user of users) {
    console.log(`Fixing user ${user.email || user._id}: tier was '${user.tier}'`);
    user.tier = 'Starter';
    await user.save();
  }
  console.log(`Done. Updated ${users.length} users with invalid tier.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Tier fix error:', err);
  process.exit(1);
});
