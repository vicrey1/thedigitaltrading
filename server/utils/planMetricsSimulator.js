const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const PlanMetricsHistory = require('../models/PlanMetricsHistory');

// Helper to get random float in range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Simulate and store metrics for all plans
async function simulatePlanMetrics() {
  const plans = await Plan.find({ simulation_enabled: true });
  for (const plan of plans) {
    // Get last metrics for drift
    const last = await PlanMetricsHistory.findOne({ plan_id: plan._id }).sort('-timestamp');
    let roi = last ? last.roi : randomInRange(plan.roi_min, plan.roi_max);
    let volatility = last ? last.volatility : randomInRange(plan.volatility_min, plan.volatility_max);
    // Drift ROI and volatility
    roi += randomInRange(-0.2, 0.2); // Small drift
    volatility += randomInRange(-0.1, 0.1);
    roi = Math.max(plan.roi_min, Math.min(plan.roi_max, roi));
    volatility = Math.max(plan.volatility_min, Math.min(plan.volatility_max, volatility));
    // Sharpe = ROI / Volatility
    const sharpe = volatility ? roi / volatility : 0;
    // Alpha and maxDrawdown can be simulated
    const alpha = randomInRange(0.3, 0.6);
    const maxDrawdown = -randomInRange(2, 6);
    // Store in history
    await PlanMetricsHistory.create({
      plan_id: plan._id,
      roi,
      sharpe,
      alpha,
      volatility,
      maxDrawdown,
      timestamp: new Date()
    });
  }
}

// Randomize interval between 5–30 minutes
function scheduleSimulation() {
  const minutes = Math.floor(randomInRange(5, 30));
  setTimeout(async () => {
    await simulatePlanMetrics();
    scheduleSimulation();
  }, minutes * 60 * 1000);
}

scheduleSimulation();

module.exports = { simulatePlanMetrics };
