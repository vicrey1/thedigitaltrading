// scripts/fix_plan_names.js
// Ensures all investments have correct planName for Platinum, Gold, Silver, Diamond

const mongoose = require('mongoose');
const Investment = require('../models/Investment');

const MONGODB_URI = process.env.MONGODB_URI;
const validPlans = ['Silver', 'Gold', 'Platinum', 'Diamond'];

async function fixPlanNames() {
  await mongoose.connect(MONGODB_URI);
  for (const plan of validPlans) {
    // Find investments with matching planId or fundName, but wrong or missing planName
    const investments = await Investment.find({
      $or: [
        { planId: plan },
        { fundName: plan }
      ],
      $or: [
        { planName: { $ne: plan } },
        { planName: { $exists: false } },
        { planName: '' }
      ]
    });
    for (const inv of investments) {
      inv.planName = plan;
      await inv.save();
      console.log(`Fixed planName for investment ${inv._id} to ${plan}`);
    }
  }
  await mongoose.disconnect();
  console.log('All plan names fixed.');
}

fixPlanNames().catch(err => {
  console.error('Fix error:', err);
  process.exit(1);
});
