const { db } = require('./db');

function logAction({ userId = null, userEmail = 'system', action, entityType, entityId = null, details = null, ipAddress = 'unknown' }) {
  try {
    const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : (details || '');
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, userEmail, action, entityType, entityId ? String(entityId) : null, detailsStr, ipAddress);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

function getAuditLogs(limit = 100) {
  return db.prepare(`
    SELECT id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at
    FROM audit_logs
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  logAction,
  getAuditLogs
};
