// middlewares/auditLog.js
const AuditLog = require('../models/AuditLog');

// General-purpose audit log middleware
function auditLog(action, entity, getEntityId = req => null) {
  return async (req, res, next) => {
    try {
      await AuditLog.create({
        admin: req.admin?.id || req.user?.id || null,
        action,
        entity,
        entityId: getEntityId(req),
        metadata: {
          body: req.body,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (err) {
      console.error('Audit log failed:', err);
    }
    next();
  };
}

exports.logBulkOperation = async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    
    await AuditLog.create({
      admin: req.admin.id,
      action: `bulk_${action}`,
      entity: 'Withdrawal',
      entityCount: ids.length,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    
    next();
  } catch (err) {
    console.error('Audit log failed:', err);
    next(); // Don't fail the request if logging fails
  }
};

exports.logExport = async (req, res, next) => {
  try {
    await AuditLog.create({
      admin: req.admin.id,
      action: 'export_withdrawals',
      entity: 'Withdrawal',
      metadata: {
        filters: req.body.filters,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    
    next();
  } catch (err) {
    console.error('Audit log failed:', err);
    next();
  }
};

module.exports = auditLog;