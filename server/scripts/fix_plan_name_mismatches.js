// scripts/fix_plan_name_mismatches.js
// Automatically sets planName to match planId for all investments

const mongoose = require('mongoose');
const Investment = require('../models/Investment');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixPlanNameMismatches() {
  await mongoose.connect(MONGODB_URI);
  const investments = await Investment.find({});
  let fixed = 0;
  for (const inv of investments) {
    if (inv.planId && inv.planName !== inv.planId) {
      inv.planName = inv.planId;
      await inv.save();
      console.log(`Fixed investment ${inv._id}: planName set to ${inv.planId}`);
      fixed++;
    }
  }
  await mongoose.disconnect();
  console.log(`Done. ${fixed} investments fixed.`);
}

fixPlanNameMismatches().catch(err => {
  console.error('Fix error:', err);
  process.exit(1);
});
