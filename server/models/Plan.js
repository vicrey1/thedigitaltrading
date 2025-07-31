// server/models/Plan.js
const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  percentReturn: { type: Number, required: true }, // e.g. 150 for 150%
  durationDays: { type: Number, required: true }, // e.g. 4 for 4 days
  minInvestment: { type: Number, default: 10 },
  maxInvestment: { type: Number, default: 100000 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  roi_min: { type: Number, default: 15 },
  roi_max: { type: Number, default: 22 },
  volatility_min: { type: Number, default: 5 },
  volatility_max: { type: Number, default: 10 },
  simulation_enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('Plan', PlanSchema);
