// scripts/fix_empty_plan_names.js
// Fills empty planName fields in investments with fundName or planId

const mongoose = require('mongoose');
const Investment = require('../models/Investment');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixEmptyPlanNames() {
  await mongoose.connect(MONGODB_URI);
  const investments = await Investment.find({ $or: [ { planName: { $exists: false } }, { planName: '' } ] });
  let updated = 0;
  for (const inv of investments) {
    if (!inv.planName || inv.planName === '') {
      // Prefer fundName, fallback to planId
      if (inv.fundName) {
        inv.planName = inv.fundName;
      } else if (inv.planId) {
        inv.planName = inv.planId;
      }
      await inv.save();
      updated++;
      console.log(`Updated investment ${inv._id} planName to ${inv.planName}`);
    }
  }
  await mongoose.disconnect();
  console.log(`Fixed ${updated} investments with empty planName.`);
}

fixEmptyPlanNames().catch(err => {
  console.error('Fix error:', err);
  process.exit(1);
});
