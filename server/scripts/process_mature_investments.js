// scripts/process_mature_investments.js
// This script processes matured investments, marks them as completed, and handles auto-payout logic.

const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const User = require('../models/User');
const UserGainLog = require('../models/UserGainLog');

const MONGODB_URI = process.env.MONGODB_URI;

async function processMatureInvestments() {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  const maturedInvestments = await Investment.find({ status: 'active', mature_at: { $lte: now } });
  for (const inv of maturedInvestments) {
    inv.status = 'completed';
    await inv.save();
    // Auto-payout: credit user's depositBalance
    const user = await User.findById(inv.user);
    if (user) {
      user.depositBalance = (user.depositBalance || 0) + inv.currentValue;
      await user.save();
    }
    // Log gain event
    await UserGainLog.create({
      user_id: inv.user,
      plan_id: inv.planId,
      gain_type: 'matured',
      value: inv.currentValue,
      message: `Investment matured and paid out: ${inv.currentValue}`
    });
    console.log(`Processed matured investment ${inv._id}`);
  }
  await mongoose.disconnect();
}

processMatureInvestments().then(() => {
  console.log('Mature investment processing complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error processing matured investments:', err);
  process.exit(1);
});
