// scripts/fix_missing_referral_codes.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function generateReferralCode(user) {
  // Use username or email prefix + random 4 digits
  const base = user.username || user.email.split('@')[0];
  let code;
  let exists = true;
  while (exists) {
    code = base + Math.floor(1000 + Math.random() * 9000);
    exists = await User.findOne({ referralCode: code });
  }
  return code;
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({ $or: [ { referralCode: null }, { referralCode: { $exists: false } } ] });
  for (const user of users) {
    user.referralCode = await generateReferralCode(user);
    await user.save();
    console.log(`Updated user ${user.email} with referral code: ${user.referralCode}`);
  }
  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
