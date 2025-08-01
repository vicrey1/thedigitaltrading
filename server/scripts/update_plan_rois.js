// scripts/update_plan_rois.js
// Updates plan percentReturn values to 350, 450, 550, 650 for Silver, Gold, Platinum, Diamond

const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const MONGODB_URI = process.env.MONGODB_URI;

const roiUpdates = {
  Silver: 350,
  Gold: 450,
  Platinum: 550,
  Diamond: 650,
};

async function updatePlanRois() {
  await mongoose.connect(MONGODB_URI);
  for (const [name, roi] of Object.entries(roiUpdates)) {
    const plan = await Plan.findOne({ name });
    if (plan) {
      plan.percentReturn = roi;
      await plan.save();
      console.log(`Updated ${name} plan ROI to ${roi}`);
    } else {
      console.log(`Plan not found: ${name}`);
    }
  }
  await mongoose.disconnect();
  console.log('Plan ROI update complete.');
}

updatePlanRois().catch(err => {
  console.error('Update error:', err);
  process.exit(1);
});
