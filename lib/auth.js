const crypto = require('node:crypto');
const { db } = require('./db');

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000);
const rateLimits = new Map();
const MAX_RATE_LIMIT_KEYS = 10000;

function checkRateLimit(ip, limit = 10, windowMs = 60000) {
  const key = String(ip || 'unknown');
  const now = Date.now();
  const timestamps = (rateLimits.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateLimits.set(key, timestamps);
  if (rateLimits.size > MAX_RATE_LIMIT_KEYS) {
    for (const [k, values] of rateLimits) {
      if (!values.some(t => now - t < windowMs)) rateLimits.delete(k);
      if (rateLimits.size <= MAX_RATE_LIMIT_KEYS) break;
    }
  }
  return true;
}

function hashPassword(password, salt = null) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Password must contain at least 12 characters');
  }
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, salt) {
  if (typeof password !== 'string' || !storedHash || !salt) return false;
  try {
    const { hash } = hashPassword(password, salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function createSession(userId, role) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(`INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)`)
    .run(token, userId, role, expiresAt);
  return { token, expiresAt };
}

function validateSession(token) {
  if (!token || typeof token !== 'string' || token.length !== 64) return null;
  const session = db.prepare(`
    SELECT s.token, s.user_id, s.role, s.expires_at, u.email, u.name, u.mfa_enabled
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, new Date().toISOString());
  return session || null;
}

function destroySession(token) {
  if (!token || typeof token !== 'string') return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

setInterval(() => {
  try { db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString()); } catch {}
}, 3600000).unref();

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (const byte of bytes) secret += BASE32_ALPHABET[byte % 32];
  return secret;
}

function base32Decode(value) {
  const clean = String(value).toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) return Buffer.alloc(0);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function generateTOTP(secret, counterStep = 0) {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + counterStep;
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep));
  const key = base32Decode(secret);
  if (!key.length) return '';
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (binary % 1000000).toString().padStart(6, '0');
}

function verifyTOTP(secret, userCode) {
  if (!secret || !userCode) return false;
  const code = String(userCode).trim();
  if (!/^\d{6}$/.test(code)) return false;
  for (let step = -1; step <= 1; step++) {
    const generated = generateTOTP(secret, step);
    if (generated && crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(code))) return true;
  }
  return false;
}

function parseCookies(req) {
  const list = {};
  const header = req.headers.cookie;
  if (!header) return list;
  for (const cookie of header.split(';')) {
    const index = cookie.indexOf('=');
    if (index === -1) continue;
    const key = cookie.slice(0, index).trim();
    const value = cookie.slice(index + 1).trim();
    try { list[key] = decodeURIComponent(value); } catch { list[key] = value; }
  }
  return list;
}

module.exports = { hashPassword, verifyPassword, createSession, validateSession, destroySession, checkRateLimit, generateBase32Secret, generateTOTP, verifyTOTP, parseCookies };