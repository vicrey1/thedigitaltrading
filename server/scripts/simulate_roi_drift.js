// scripts/simulate_roi_drift.js
// This script simulates ROI drift for active investments and logs gain events.

const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const UserGainLog = require('../models/UserGainLog');

const MONGODB_URI = process.env.MONGODB_URI;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

async function simulateRoiDrift() {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  const activeInvestments = await Investment.find({ status: 'active' });
  for (const inv of activeInvestments) {
    const plan = await Plan.findOne({ _id: inv.planId });
    if (!plan || !plan.simulation_enabled) continue;
    // Simulate ROI drift for this period (e.g., daily)
    const roiDrift = randomInRange(plan.roi_min, plan.roi_max) / 100;
    const gain = parseFloat((inv.amount * roiDrift / plan.durationDays).toFixed(2));
    inv.currentValue += gain;
    await inv.save();
    // Log gain event
    await UserGainLog.create({
      user_id: inv.user,
      plan_id: inv.planId,
      gain_type: 'roi_drift',
      value: gain,
      message: `Simulated ROI drift gain: ${gain}`
    });
    console.log(`Simulated ROI drift for investment ${inv._id}: +${gain}`);
  }
  await mongoose.disconnect();
}

simulateRoiDrift().then(() => {
  console.log('ROI drift simulation complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error simulating ROI drift:', err);
  process.exit(1);
});
