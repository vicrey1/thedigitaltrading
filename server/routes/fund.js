const express = require('express');
const router = express.Router();
const Fund = require('../models/Fund');
const fundController = require('../controllers/fundController');

// List all funds
router.get('/', async (req, res) => {
  const funds = await Fund.find({}, 'title slug roi description icon type');
  res.json(funds);
});

// Get fund by slug
router.get('/:slug', async (req, res) => {
  const fund = await Fund.findOne({ slug: req.params.slug });
  if (!fund) return res.status(404).json({ error: 'Not found' });
  res.json(fund);
});

// Create a new fund
router.post('/', fundController.createFund);

module.exports = router;
