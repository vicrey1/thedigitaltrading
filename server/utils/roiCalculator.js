// server/utils/roiCalculator.js
const cron = require('node-cron');
const Investment = require('../models/Investment');
const MarketEvent = require('../models/MarketEvent');
const UserGainLog = require('../models/UserGainLog');

async function runRoiSimulation() {
  try {
    console.log('[ROI SIM] Running ROI simulation cron...');
    const investments = await Investment.find({ status: 'active' }).lean().exec();
    for (const investment of investments) {
      const now = new Date();
      // Simulate random fluctuation: -2% to +4% of initial amount per 5 min
      const PLAN_CONFIG = {
        Silver: { roi: 350, duration: 7 },
        Gold: { roi: 450, duration: 10 },
        Platinum: { roi: 550, duration: 15 },
        Diamond: { roi: 650, duration: 21 },
      };
      const plan = PLAN_CONFIG[investment.planName] || PLAN_CONFIG[investment.fundName];
      if (!plan) continue;
      const totalMinutes = plan.duration * 24 * 60;
      const start = new Date(investment.startDate);
      const elapsedMinutes = Math.floor((now - start) / (1000 * 60));
      const expectedFinalValue = investment.amount + (investment.amount * plan.roi / 100);
      const minutesLeft = totalMinutes - elapsedMinutes;
      let fluctuation = (Math.random() * 0.06 - 0.02) * investment.amount;
      if (fluctuation === 0) fluctuation = (Math.random() < 0.5 ? -1 : 1) * 0.01 * investment.amount;
      if (minutesLeft <= 5) {
        // Only adjust up if below expected ROI
        if (investment.currentValue < expectedFinalValue) {
          fluctuation = expectedFinalValue - investment.currentValue;
        } else {
          // No adjustment if already at or above expected ROI
          continue;
        }
      }
      // Fetch the full investment doc for update
      const invDoc = await Investment.findById(investment._id);
      invDoc.currentValue += fluctuation;
      invDoc.transactions.push({
        type: 'roi',
        amount: fluctuation,
        date: now,
        description: fluctuation >= 0 ? 'Gain' : 'Loss'
      });
      // Create UserGainLog entry
      await UserGainLog.create({
        user_id: invDoc.user,
        plan_id: invDoc.planId, // Use string planId
        gain_type: 'ROI',
        value: fluctuation,
        message: fluctuation >= 0 ? `Gain of $${fluctuation.toFixed(2)}` : `Loss of $${Math.abs(fluctuation).toFixed(2)}`,
        logged_at: now
      });
      if (fluctuation >= 0) {
        console.log(`[ROI SIM][GAIN] Investment ${invDoc._id} (${invDoc.planName}): +$${fluctuation.toFixed(2)} | Current Value: $${invDoc.currentValue.toFixed(2)}`);
      } else {
        console.log(`[ROI SIM][LOSS] Investment ${invDoc._id} (${invDoc.planName}): -$${Math.abs(fluctuation).toFixed(2)} | Current Value: $${invDoc.currentValue.toFixed(2)}`);
      }
      // Mark as completed if matured
      if (minutesLeft <= 0) {
        invDoc.status = 'completed';
      }
      await invDoc.save();
    }
  } catch (err) {
    console.error('Error calculating ROI:', err.message);
  }
}

function startRoiCron() {
  cron.schedule('*/5 * * * *', async () => {
    await runRoiSimulation();
  });
  console.log('[ROI SIM] ROI simulation cron scheduled.');
}

module.exports = { startRoiCron };