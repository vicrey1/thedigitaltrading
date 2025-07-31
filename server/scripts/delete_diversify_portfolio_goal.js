const mongoose = require('mongoose');
const Goal = require('../models/Goal');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Goal.deleteMany({ title: 'Diversify Portfolio' });
  console.log(`Deleted ${result.deletedCount} goal(s) with title 'Diversify Portfolio'.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
