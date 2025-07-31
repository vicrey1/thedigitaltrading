const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: false },
  action: String,
  entity: String,
  entityId: String,
  entityCount: Number,
  metadata: Object,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
