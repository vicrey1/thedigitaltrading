// scripts/fix_investment_plan_names.js
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const MONGO_URI = process.env.MONGO_URI;

const PLAN_NAMES = ['Silver', 'Gold', 'Platinum', 'Diamond'];

async function fixPlanNames() {
  await mongoose.connect(MONGO_URI);
  const investments = await Investment.find();
  for (const inv of investments) {
    // If planName is missing or not a valid plan, try to fix it
    if (!PLAN_NAMES.includes(inv.planName)) {
      // Try to infer from fundName, planId, or fundId
      const possible = PLAN_NAMES.find(p => [inv.fundName, inv.planId, inv.fundId].includes(p));
      if (possible) {
        inv.planName = possible;
        await inv.save();
        console.log(`Fixed planName for investment ${inv._id} to ${possible}`);
      }
    }
  }
  console.log('Done fixing plan names.');
  process.exit(0);
}

fixPlanNames();
