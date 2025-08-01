// Script to reset currentValue for all active investments to their amount
const mongoose = require('mongoose');
const Investment = require('../models/Investment');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await Investment.updateMany(
    { status: 'active' },
    [
      { $set: { currentValue: "$amount" } }
    ]
  );
  console.log(`Reset currentValue for ${result.modifiedCount} active investments.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
