const mongoose = require('mongoose');
const Goal = require('../models/Goal');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  // List all goals
  const allGoals = await Goal.find();
  console.log('All goals in database:');
  allGoals.forEach(g => console.log(`- [${g._id}] ${g.title}`));

  // Delete goals with title containing 'Diversify Portfolio' (case-insensitive)
  const result = await Goal.deleteMany({ title: { $regex: /diversify portfolio/i } });
  console.log(`\nDeleted ${result.deletedCount} goal(s) with title containing 'Diversify Portfolio'.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
