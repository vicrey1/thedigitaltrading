// server/scripts/update_roi.js
// Run this script daily to automate ROI updates for all active investments

const mongoose = require('mongoose');
const Investment = require('../models/Investment');

const MONGO_URI = process.env.MONGO_URI;
const DAILY_ROI_RATE = 0.0005; // 0.05% daily ROI (example)

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

async function updateROI() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const today = new Date();
  const investments = await Investment.find({ status: 'active', endDate: { $gt: today } });
  let updated = 0;
  for (const inv of investments) {
    // Prevent duplicate ROI for today
    const lastRoiTx = (inv.transactions || []).filter(t => t.type === 'roi').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (lastRoiTx && isSameDay(new Date(lastRoiTx.date), today)) {
      continue; // Already credited today
    }
    // Use per-investment or per-plan rate if available, else default
    const roiRate = inv.roiRate || DAILY_ROI_RATE;
    const roiAmount = inv.currentValue * roiRate;
    inv.transactions.push({ type: 'roi', amount: roiAmount, date: today, description: 'Daily ROI' });
    inv.currentValue += roiAmount;
    await inv.save();
    console.log(`Updated investment ${inv._id} for user ${inv.user}: +${roiAmount.toFixed(2)} ROI`);
    updated++;
  }
  console.log(`Updated ROI for ${updated} investments.`);
  await mongoose.disconnect();
}

updateROI().catch(err => {
  console.error(err);
  process.exit(1);
});
