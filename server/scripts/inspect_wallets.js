// scripts/inspect_wallets.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function inspect(emailOrUsername) {
  await mongoose.connect(MONGO_URI);
  let user;
  if (emailOrUsername) {
    user = await User.findOne({ $or: [ { email: emailOrUsername }, { username: emailOrUsername } ] });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    console.log('Wallets for', user.email || user.username, ':');
    console.dir(user.wallets, { depth: 4 });
  } else {
    const users = await User.find();
    for (const user of users) {
      console.log('Wallets for', user.email || user.username, ':');
      console.dir(user.wallets, { depth: 4 });
    }
  }
  process.exit(0);
}

const arg = process.argv[2];
inspect(arg).catch(e => { console.error(e); process.exit(1); });
