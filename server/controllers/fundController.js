const Fund = require('../models/Fund');
const slugify = require('../utils/slugify');

exports.createFund = async (req, res) => {
  try {
    const { title, roi, description, details, icon, type } = req.body;
    const slug = slugify(title);
    const fund = new Fund({ title, slug, roi, description, details, icon, type });
    await fund.save();
    res.status(201).json(fund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};