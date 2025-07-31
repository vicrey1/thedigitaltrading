const mongoose = require('mongoose');

const UserGainLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: String, required: true }, // Accept string planId
  gain_type: { type: String, required: true }, // e.g., ROI, drawdown, bonus
  value: { type: Number, required: true },
  message: { type: String },
  logged_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserGainLog', UserGainLogSchema);
