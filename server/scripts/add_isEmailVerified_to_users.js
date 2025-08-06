// Script to add isEmailVerified: false to all users missing the field
// Usage: node scripts/add_isEmailVerified_to_users.js

const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable must be set.');
}

async function addIsEmailVerifiedField() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await User.updateMany(
    { isEmailVerified: { $exists: false } },
    { $set: { isEmailVerified: false } }
  );
  console.log('Updated users:', result.nModified);
  await mongoose.disconnect();
}

addIsEmailVerifiedField().catch(err => {
  console.error(err);
  process.exit(1);
});
