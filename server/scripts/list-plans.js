// server/scripts/list-plans.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

async function listPlans() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment variables. Make sure it is set in your production environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to production MongoDB.');

    const plans = await Plan.find({});
    
    console.log('--- Main Investment Plans in Production Database ---');
    if (plans.length === 0) {
      console.log('No investment plans found in the database.');
    } else {
      console.log(JSON.stringify(plans, null, 2));
    }

  } catch (error) {
    console.error('❌ Error fetching plans from database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

listPlans();
