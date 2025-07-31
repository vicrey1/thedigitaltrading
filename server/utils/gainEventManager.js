const mongoose = require('mongoose');
const User = require('./models/User');
const Plan = require('./models/Plan');
const UserGainLog = require('./models/UserGainLog');

// Admin-triggered gain event
async function triggerGainEvent({ userIds, planId, gain_type, value, message, scheduled_at }) {
  const logs = userIds.map(user_id => ({
    user_id,
    plan_id: planId,
    gain_type,
    value,
    message,
    logged_at: scheduled_at || new Date()
  }));
  await UserGainLog.insertMany(logs);
}

// Schedule future event
function scheduleGainEvent(event) {
  const delay = new Date(event.scheduled_at) - Date.now();
  if (delay > 0) {
    setTimeout(() => triggerGainEvent(event), delay);
  } else {
    triggerGainEvent(event);
  }
}

module.exports = { triggerGainEvent, scheduleGainEvent };
