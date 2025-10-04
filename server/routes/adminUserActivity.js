// Get user activity logs for admin panel
const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const AuditLog = require('../models/AuditLog');

// GET /api/admin/users/:id/activity
router.get('/users/:id/activity', ...authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Find all audit logs where entity is 'User' and entityId matches the user
    const logs = await AuditLog.find({ entity: 'User', entityId: id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json({ activity: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
