// server/scripts/simulate_investment_growth.js
// Simulate investment growth for all active investments
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
require('dotenv').config({ path: '../../.env' });

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const now = new Date();
  const activeInvestments = await Investment.find({ status: 'active' });
  for (const inv of activeInvestments) {
    // Get plan details
    const plan = await Plan.findOne({ _id: inv.planId });
    if (!plan) continue;
    // Calculate elapsed time
    const elapsedMs = now - inv.startDate;
    const totalMs = inv.endDate - inv.startDate;
    if (elapsedMs >= totalMs) {
      // Complete investment
      inv.currentValue = inv.amount * (1 + plan.percentReturn / 100);
      inv.status = 'completed';
    } else {
      // Simulate growth: randomize within a range, ensure final value is at least plan.percentReturn
      const progress = elapsedMs / totalMs;
      const minGrowth = inv.amount * (1 + (plan.percentReturn - 100) * 0.8 / 100 * progress); // 80% of target
      const maxGrowth = inv.amount * (1 + (plan.percentReturn - 100) * 1.2 / 100 * progress); // 120% of target
      let newValue = minGrowth + Math.random() * (maxGrowth - minGrowth);
      newValue = Math.min(newValue, inv.amount * (plan.percentReturn / 100));
      inv.currentValue = parseFloat(newValue.toFixed(2 + Math.floor(Math.random()*2))); // 2-3 decimals
    }
    await inv.save();
  }
  await mongoose.disconnect();
  console.log('Investment growth simulation complete.');
}

main();
