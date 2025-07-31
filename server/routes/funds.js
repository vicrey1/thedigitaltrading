const express = require('express');
const router = express.Router();
const Fund = require('../models/Fund');
const authAdmin = require('../middleware/authAdmin');
const multer = require('multer');
const path = require('path');

// Multer storage for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/reports'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all funds
router.get('/', async (req, res) => {
  const funds = await Fund.find();
  res.json(funds);
});

// Get single fund
router.get('/:id', async (req, res) => {
  const fund = await Fund.findById(req.params.id);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  res.json(fund);
});

// Admin: Create fund
router.post('/', authAdmin, async (req, res) => {
  const fund = new Fund(req.body);
  await fund.save();
  res.status(201).json(fund);
});

// Admin: Update fund
router.patch('/:id', authAdmin, async (req, res) => {
  const fund = await Fund.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  res.json(fund);
});

// Admin: Delete fund
router.delete('/:id', authAdmin, async (req, res) => {
  await Fund.findByIdAndDelete(req.params.id);
  res.json({ message: 'Fund deleted' });
});

// Admin: Add plan to fund
router.post('/:id/plans', authAdmin, async (req, res) => {
  const fund = await Fund.findById(req.params.id);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  fund.plans.push(req.body);
  await fund.save();
  res.json(fund);
});

// Admin: Update plan in fund
router.patch('/:fundId/plans/:planId', authAdmin, async (req, res) => {
  const fund = await Fund.findById(req.params.fundId);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  const plan = fund.plans.id(req.params.planId);
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  Object.assign(plan, req.body);
  await fund.save();
  res.json(fund);
});

// Admin: Delete plan from fund
router.delete('/:fundId/plans/:planId', authAdmin, async (req, res) => {
  const fund = await Fund.findById(req.params.fundId);
  if (!fund) return res.status(404).json({ message: 'Fund not found' });
  fund.plans.id(req.params.planId).remove();
  await fund.save();
  res.json(fund);
});

// Upload PDF report for a fund
router.post('/:id/report', authAdmin, upload.single('pdf'), async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    fund.reportUrl = '/uploads/reports/' + req.file.filename;
    await fund.save();
    res.json({ message: 'PDF uploaded', reportUrl: fund.reportUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Push admin alert to a fund
router.post('/:id/alert', authAdmin, async (req, res) => {
  try {
    const { alert } = req.body;
    const fund = await Fund.findById(req.params.id);
    if (!fund) return res.status(404).json({ message: 'Fund not found' });
    if (!fund.alerts) fund.alerts = [];
    fund.alerts.push({ message: alert, date: new Date() });
    await fund.save();
    res.json({ message: 'Alert sent', alerts: fund.alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
