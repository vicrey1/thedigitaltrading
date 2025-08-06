// scripts/backfill_current_value.js
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable must be set.');
}

const PLAN_CONFIG = {
  Silver: { roi: 350 },
  Gold: { roi: 450 },
  Platinum: { roi: 550 },
  Diamond: { roi: 650 }
};

async function backfillCurrentValue() {
  await mongoose.connect(MONGO_URI);
  const investments = await Investment.find();
  for (const inv of investments) {
    if (typeof inv.currentValue !== 'number' || isNaN(inv.currentValue)) {
      // Calculate expected current value based on plan ROI
      const plan = PLAN_CONFIG[inv.planName];
      if (plan && typeof inv.amount === 'number') {
        inv.currentValue = inv.amount * (1 + plan.roi / 100);
        await inv.save();
        console.log(`Updated investment ${inv._id}: currentValue set to ${inv.currentValue}`);
      }
    }
  }
  console.log('Done backfilling current values.');
  process.exit(0);
}

backfillCurrentValue();
