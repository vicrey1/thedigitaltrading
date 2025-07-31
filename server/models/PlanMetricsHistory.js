const mongoose = require('mongoose');

const PlanMetricsHistorySchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  roi: Number,
  sharpe: Number,
  alpha: Number,
  volatility: Number,
  maxDrawdown: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlanMetricsHistory', PlanMetricsHistorySchema);
