// server/routes/admin/plans.js
const express = require('express');
const router = express.Router();
const Plan = require('../../models/Plan');
const authAdmin = require('../../middleware/authAdmin');

// Get all plans
router.get('/', authAdmin, async (req, res) => {
  const plans = await Plan.find();
  res.json(plans);
});

// Create a new plan
router.post('/', authAdmin, async (req, res) => {
  const plan = new Plan(req.body);
  await plan.save();
  res.json(plan);
});

// Update a plan
router.put('/:id', authAdmin, async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(plan);
});

// Delete a plan
router.delete('/:id', authAdmin, async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
