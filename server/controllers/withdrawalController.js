// controllers/withdrawalController.js
const Withdrawal = require('../models/Withdrawal');
const { validateBulkUpdate } = require('../validators/withdrawalValidator');

exports.bulkUpdate = async (req, res) => {
  try {
    const { ids, action, adminNotes } = req.body;
    const adminId = req.admin.id;

    // Validate input
    const { error } = validateBulkUpdate({ ids, action });
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Check for maximum batch size
    if (ids.length > 100) {
      return res.status(400).json({ message: 'Maximum batch size is 100 withdrawals' });
    }

    // Find all pending withdrawals in the IDs list
    const pendingWithdrawals = await Withdrawal.find({
      _id: { $in: ids },
      status: 'pending'
    });

    if (pendingWithdrawals.length === 0) {
      return res.status(400).json({ message: 'No pending withdrawals found to update' });
    }

    // Prepare bulk write operations
    const bulkOps = pendingWithdrawals.map(wd => ({
      updateOne: {
        filter: { _id: wd._id },
        update: {
          $set: {
            status: action,
            adminNotes,
            processedAt: new Date(),
            processedBy: adminId
          }
        }
      }
    }));

    // Execute bulk write
    const result = await Withdrawal.bulkWrite(bulkOps);

    // In a real application, you would:
    // 1. Process blockchain transactions for approved withdrawals
    // 2. Send notifications to users
    // 3. Update user balances if needed

    res.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ message: 'Server error during bulk operation' });
  }
};