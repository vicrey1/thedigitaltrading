// server/routes/performance.js
const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const PlanMetricsHistory = require('../models/PlanMetricsHistory');
const UserGainLog = require('../models/UserGainLog');
const { simulatePlanMetrics } = require('../utils/planMetricsSimulator');

// Utility functions for metrics
function calculateROI(investments) {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  return totalInvested ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
}

function calculateReturnsArray(investments) {
  // Simulate daily returns for the last 30 days
  // In production, use real historical data
  return Array.from({ length: 30 }, () => (Math.random() - 0.5) * 0.02); // -1% to +1% daily
}

function calculateSharpeRatio(returns) {
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / returns.length);
  const riskFreeRate = 0.0001; // Simulated daily risk-free rate
  return std ? ((avg - riskFreeRate) / std) * Math.sqrt(252) : 0;
}

function calculateAlpha(returns) {
  // Simulate alpha as a random value for now
  return 0.45;
}

function calculateVolatility(returns) {
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / returns.length);
  return std * Math.sqrt(252) * 100; // Annualized volatility in %
}

function calculateMaxDrawdown(returns) {
  let peak = 0, trough = 0, maxDD = 0, cumulative = 0;
  for (const r of returns) {
    cumulative += r;
    if (cumulative > peak) peak = cumulative;
    if (cumulative < trough) trough = cumulative;
    const dd = (peak - cumulative) / (peak || 1);
    if (dd > maxDD) maxDD = dd;
  }
  return -maxDD * 100;
}

// Get latest metrics for a plan
async function getLatestMetrics(planId) {
  return PlanMetricsHistory.findOne({ plan_id: planId }).sort('-timestamp');
}

// Get metrics history for a plan (e.g., last 14 days)
async function getMetricsHistory(planId, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return PlanMetricsHistory.find({ plan_id: planId, timestamp: { $gte: since } }).sort('timestamp');
}

router.get('/', async (req, res) => {
  try {
    const investments = await Investment.find({ status: 'Active' });
    const returns = calculateReturnsArray(investments);
    const roi = calculateROI(investments);
    const sharpe = calculateSharpeRatio(returns);
    const alpha = calculateAlpha(returns);
    const volatility = calculateVolatility(returns);
    const maxDrawdown = calculateMaxDrawdown(returns);
    res.json({
      roi: roi.toFixed(2),
      sharpe: sharpe.toFixed(2),
      alpha: alpha.toFixed(2),
      volatility: volatility.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/performance/plan/:planId - latest metrics for a plan
router.get('/plan/:planId', async (req, res) => {
  try {
    const metrics = await getLatestMetrics(req.params.planId);
    if (!metrics) return res.status(404).json({ error: 'No metrics found' });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/performance/plan/:planId/history - metrics history for a plan
router.get('/plan/:planId/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const history = await getMetricsHistory(req.params.planId, days);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/performance/user/:userId/gain-logs - get user gain logs
router.get('/user/:userId/gain-logs', async (req, res) => {
  try {
    const logs = await UserGainLog.find({ user_id: req.params.userId }).sort('-logged_at').limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/performance/admin/gain-event - admin triggers/schedules gain event
router.post('/admin/gain-event', async (req, res) => {
  try {
    const { userIds, planId, gain_type, value, message, scheduled_at } = req.body;
    const { triggerGainEvent, scheduleGainEvent } = require('../utils/gainEventManager');
    if (scheduled_at) {
      scheduleGainEvent({ userIds, planId, gain_type, value, message, scheduled_at });
    } else {
      await triggerGainEvent({ userIds, planId, gain_type, value, message });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Performance router is working!' });
});

// Start automatic simulation on server start
simulatePlanMetrics();

module.exports = router;
