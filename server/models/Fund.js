const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: String,
  roi: Number,
  lockPeriod: Number, // in days
  compounding: Boolean,
  minInvestment: Number,
  maxInvestment: Number,
});

const FundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  roi: String,
  description: String,
  details: String,
  icon: String,
  type: String,
  plans: [PlanSchema],
  strategistNotes: String,
  managerProfile: String,
  badges: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Fund', FundSchema);
