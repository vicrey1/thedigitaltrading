// scripts/backfill_planId_objectId.js
// This script updates all investments to use the correct planId (ObjectId) instead of the plan name.

const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');

const MONGODB_URI = process.env.MONGODB_URI;

async function backfillPlanId() {
  await mongoose.connect(MONGODB_URI);
  const investments = await Investment.find({});
  let updated = 0;
  for (const inv of investments) {
    // Only update if planId is not an ObjectId
    if (typeof inv.planId === 'string' && !inv.planId.match(/^[0-9a-fA-F]{24}$/)) {
      const plan = await Plan.findOne({ name: inv.planId });
      if (plan) {
        inv.planId = plan._id;
        await inv.save();
        updated++;
        console.log(`Updated investment ${inv._id}: planId set to ${plan._id}`);
      } else {
        console.warn(`No plan found for name: ${inv.planId} (investment ${inv._id})`);
      }
    }
  }
  await mongoose.disconnect();
  console.log(`Backfill complete. Updated ${updated} investments.`);
}

backfillPlanId().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});
