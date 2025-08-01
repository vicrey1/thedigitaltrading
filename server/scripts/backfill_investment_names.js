// Script to backfill fundName and planName for all investments
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Fund = require('../models/Fund');

const MONGO_URI = process.env.MONGO_URI;

async function backfill() {
  await mongoose.connect(MONGO_URI);
  const investments = await Investment.find();
  for (const inv of investments) {
    let fundName = '';
    let planName = '';
    if (inv.fundId) {
      const fund = await Fund.findOne({ _id: inv.fundId });
      if (fund) {
        fundName = fund.title;
        if (inv.planId && fund.plans && fund.plans.length > 0) {
          const plan = fund.plans.id(inv.planId) || fund.plans.find(p => p._id?.toString() === inv.planId?.toString());
          if (plan) planName = plan.name;
        }
      }
    }
    inv.fundName = fundName;
    inv.planName = planName;
    await inv.save();
    console.log(`Updated investment ${inv._id}: fundName='${fundName}', planName='${planName}'`);
  }
  await mongoose.disconnect();
  console.log('Backfill complete.');
}

backfill().catch(err => { console.error(err); process.exit(1); });
