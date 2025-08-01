// scripts/seed_plans.js
// This script seeds the Plan collection with standard plans if they do not exist.

const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const MONGODB_URI = process.env.MONGODB_URI;

const plans = [
  { name: 'Starter', description: 'Starter plan', percentReturn: 150, durationDays: 4, minInvestment: 100, maxInvestment: 999 },
  { name: 'Silver', description: 'Silver plan', percentReturn: 220, durationDays: 7, minInvestment: 1000, maxInvestment: 4999 },
  { name: 'Gold', description: 'Gold plan', percentReturn: 350, durationDays: 10, minInvestment: 5000, maxInvestment: 19999 },
  { name: 'Platinum', description: 'Platinum plan', percentReturn: 500, durationDays: 15, minInvestment: 20000, maxInvestment: 49999 },
  { name: 'Diamond', description: 'Diamond plan', percentReturn: 650, durationDays: 21, minInvestment: 50000, maxInvestment: 1000000 }
];

async function seedPlans() {

  await mongoose.connect(MONGODB_URI);
  for (const plan of plans) {
    await Plan.findOneAndUpdate(
      { name: plan.name },
      plan,
      { upsert: true, new: true }
    );
    console.log(`Seeded plan: ${plan.name}`);
  }
  await mongoose.disconnect();
  console.log('Plan seeding complete.');
}

seedPlans().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
