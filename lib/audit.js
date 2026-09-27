const { db } = require('./db');

const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'salt', 'mfa_secret', 'totp_code', 'token',
  'access_token', 'refresh_token', 'authorization', 'cookie', 'session',
  'turnstile_token', 'api_key', 'secret'
]);

function sanitize(value, depth = 0) {
  if (depth > 4) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 4000 ? `${value.slice(0, 4000)}…` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitize(item, depth + 1));

  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
      output[key] = '[REDACTED]';
    } else {
      output[key] = sanitize(item, depth + 1);
    }
  }
  return output;
}

function normalizeIp(ipAddress) {
  if (!ipAddress) return 'unknown';
  return String(ipAddress).slice(0, 128);
}

function logAction({ userId = null, userEmail = 'system', action, entityType, entityId = null, details = null, ipAddress = 'unknown' }) {
  try {
    const detailsStr = typeof details === 'object' && details !== null
      ? JSON.stringify(sanitize(details))
      : String(details || '').slice(0, 4000);

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      String(userEmail || 'system').slice(0, 320),
      String(action || 'UNKNOWN').slice(0, 128),
      String(entityType || 'unknown').slice(0, 128),
      entityId === null || entityId === undefined ? null : String(entityId).slice(0, 128),
      detailsStr,
      normalizeIp(ipAddress)
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

function getAuditLogs(limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return db.prepare(`
    SELECT id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at
    FROM audit_logs
    ORDER BY id DESC
    LIMIT ?
  `).all(safeLimit);
}

module.exports = {
  logAction,
  getAuditLogs
};