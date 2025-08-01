// scripts/print_gain_logs.js
// This script prints all UserGainLog documents for inspection.

const mongoose = require('mongoose');
const UserGainLog = require('../models/UserGainLog');

const MONGODB_URI = process.env.MONGODB_URI;

async function printGainLogs() {
  await mongoose.connect(MONGODB_URI);
  const logs = await UserGainLog.find({});
  logs.forEach(log => {
    console.log(`_id: ${log._id}, user_id: ${log.user_id}, plan_id: ${log.plan_id}, gain_type: ${log.gain_type}, value: ${log.value}, message: ${log.message}, logged_at: ${log.logged_at}`);
  });
  await mongoose.disconnect();
  console.log(`Total gain logs: ${logs.length}`);
}

printGainLogs().catch(err => {
  console.error('Print error:', err);
  process.exit(1);
});
