// Script to assign unique referral codes to all users missing one
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load .env from project root or server folder
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function generateUniqueReferralCode() {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(5).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    exists = await User.findOne({ referralCode: code });
  }
  return code;
}

async function backfillReferralCodes() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in environment variables');
  }
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({ $or: [ { referralCode: { $exists: false } }, { referralCode: null } ] });
  let updated = 0;
  for (const user of users) {
    user.referralCode = await generateUniqueReferralCode();
    await user.save();
    updated++;
    console.log(`Assigned referral code to user: ${user.email} (${user.referralCode})`);
  }
  console.log(`Done. Updated ${updated} users.`);
  await mongoose.disconnect();
}

backfillReferralCodes().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
