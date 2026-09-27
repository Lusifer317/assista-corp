const crypto = require('node:crypto');

const CSRF_COOKIE = 'assista_csrf';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_BYTES = 32;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function createCsrfToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function getCsrfCookie(req) {
  const header = req.headers.cookie || '';
  for (const item of header.split(';')) {
    const [name, ...rest] = item.trim().split('=');
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function issueCsrfCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${CSRF_COOKIE}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Lax; Path=/`);
}

function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function validateCsrf(req) {
  if (SAFE_METHODS.has(req.method)) return true;
  const cookieToken = getCsrfCookie(req);
  const headerToken = req.headers[CSRF_HEADER];
  return Boolean(cookieToken && typeof headerToken === 'string' && constantTimeEqual(cookieToken, headerToken));
}

module.exports = { CSRF_COOKIE, CSRF_HEADER, createCsrfToken, issueCsrfCookie, validateCsrf };