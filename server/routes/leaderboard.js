// server/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Investment = require('../models/Investment');

// Simulated advanced leaderboard endpoint
router.get('/', async (req, res) => {
  try {
    // Simulate 10 top users with random data
    const countries = ['USA', 'UK', 'Germany', 'Singapore', 'UAE', 'Canada', 'France', 'Japan', 'Australia', 'Brazil'];
    const funds = ['Spot Market', 'Derivatives', 'Yield Farming', 'NFT Fund', 'Arbitrage'];
    const leaders = Array.from({ length: 10 }).map((_, i) => {
      const roi = (Math.random() * 120 + 20).toFixed(2);
      const perf = `${(Math.random() * 10 + 5).toFixed(2)}%/mo`;
      return {
        id: i + 1,
        username: `investor${i + 1}`,
        country: countries[i % countries.length],
        roi,
        bestFund: funds[Math.floor(Math.random() * funds.length)],
        performance: perf
      };
    });
    res.json({ leaders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
