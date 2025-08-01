// scripts/list_investment_plans.js
// Lists all investments with their planId and planName for verification

const mongoose = require('mongoose');
const Investment = require('../models/Investment');

const MONGODB_URI = process.env.MONGODB_URI;

async function listInvestmentPlans() {
  await mongoose.connect(MONGODB_URI);
  const investments = await Investment.find({});
  for (const inv of investments) {
    console.log(`ID: ${inv._id} | planId: ${inv.planId} | planName: ${inv.planName}`);
  }
  await mongoose.disconnect();
  console.log('Done listing investments.');
}

listInvestmentPlans().catch(err => {
  console.error('List error:', err);
  process.exit(1);
});
