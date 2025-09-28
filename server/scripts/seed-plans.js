// server/scripts/seed-plans.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const defaultPlans = [
  { name: 'Starter', percentReturn: 150, durationDays: 4, minInvestment: 100, maxInvestment: 999, description: 'A great starting point for new investors.' },
  { name: 'Silver', percentReturn: 350, durationDays: 7, minInvestment: 1000, maxInvestment: 4999, description: 'Balanced growth for steady returns.' },
  { name: 'Gold', percentReturn: 450, durationDays: 10, minInvestment: 5000, maxInvestment: 19999, description: 'Accelerated growth for serious investors.' },
  { name: 'Platinum', percentReturn: 550, durationDays: 15, minInvestment: 20000, maxInvestment: 49999, description: 'High-yield returns for experienced traders.' },
  { name: 'Diamond', percentReturn: 650, durationDays: 21, minInvestment: 50000, maxInvestment: 1000000, description: 'Maximum returns for elite investors.' }
];

async function seedPlans() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment variables. Make sure it is set.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to production MongoDB.');

    const existingPlans = await Plan.find({ name: { $in: defaultPlans.map(p => p.name) } });
    
    if (existingPlans.length >= defaultPlans.length) {
      console.log('All default investment plans already exist. No action taken.');
    } else {
      console.log('Some plans are missing. Seeding database...');
      for (const planData of defaultPlans) {
        const planExists = await Plan.findOne({ name: planData.name });
        if (!planExists) {
          await new Plan(planData).save();
          console.log(`- Created '${planData.name}' plan.`);
        }
      }
      console.log('✅ Database seeding complete.');
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedPlans();
