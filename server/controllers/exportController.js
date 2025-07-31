// controllers/exportController.js
const Withdrawal = require('../models/Withdrawal');
const { createCsvStream } = require('../utils/csvExporter');
const { validateExportRequest } = require('../validators/exportValidator');

exports.exportWithdrawals = async (req, res) => {
  try {
    const { filters } = req.body;
    
    // Validate export request
    const { error } = validateExportRequest(filters);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Build query from filters
    const query = buildWithdrawalQuery(filters);
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=withdrawals_${Date.now()}.csv`);
    
    // Create CSV transform stream
    const csvStream = createCsvStream();
    
    // Pipe MongoDB query results through CSV transformer to response
    const withdrawalStream = Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(10000) // Safety limit
      .lean()
      .cursor()
      .pipe(csvStream)
      .pipe(res);
    
    // Handle stream errors
    withdrawalStream.on('error', (err) => {
      console.error('Export stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Export failed' });
      }
    });

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Server error during export' });
  }
};

function buildWithdrawalQuery(filters) {
  const query = {};
  
  // Status filter
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }
  
  // Currency filter
  if (filters.currency && filters.currency !== 'all') {
    query.currency = filters.currency;
  }
  
  // Date range filter
  if (filters.dateRange) {
    const days = parseInt(filters.dateRange);
    if (!isNaN(days)) {
      query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
  }
  
  // Amount range filter
  if (filters.amountMin || filters.amountMax) {
    query.amount = {};
    if (filters.amountMin) query.amount.$gte = parseFloat(filters.amountMin);
    if (filters.amountMax) query.amount.$lte = parseFloat(filters.amountMax);
  }
  
  return query;
}