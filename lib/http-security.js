const http = require('node:http');
const crypto = require('node:crypto');
const { createCsrfToken, issueCsrfCookie, validateCsrf } = require('./csrf');
const { allowRequest } = require('./api-rate-limit');
const { buildCsp } = require('./csp');

let installed = false;

function pathnameOf(req) {
  try { return new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname; } catch { return ''; }
}

function isProtectedMutation(req) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;
  const pathname = pathnameOf(req);
  return pathname.startsWith('/api/admin/') || pathname === '/api/auth/logout' || pathname === '/api/auth/mfa/setup' || pathname === '/api/auth/mfa/verify';
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const candidate = new URL(origin);
    const expected = String(req.headers.host || '').split(':')[0].toLowerCase();
    return candidate.hostname.toLowerCase() === expected;
  } catch { return false; }
}

function installHttpSecurity() {
  if (installed) return;
  installed = true;

  const originalSetHeader = http.ServerResponse.prototype.setHeader;
  const originalCreateServer = http.createServer;

  http.ServerResponse.prototype.setHeader = function setHeader(name, value) {
    if (String(name).toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value : [value];
      value = cookies.map(cookie => {
        if (typeof cookie !== 'string' || !cookie.startsWith('assista_session=')) return cookie;
        const deleteCookie = /(?:^|;)\s*Max-Age=0(?:;|$)/i.test(cookie);
        let normalized = cookie.replace(/;\s*Max-Age=\d+/i, '').replace(/;\s*Secure/i, '').replace(/;\s*HttpOnly/i, '').replace(/;\s*SameSite=[^;]+/i, '').replace(/;\s*Path=[^;]+/i, '');
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const maxAge = deleteCookie ? 0 : Math.max(0, Math.floor(Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000) / 1000));
        return `${normalized}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
      });
    }
    return originalSetHeader.call(this, name, value);
  };

  http.createServer = function securedCreateServer(requestListener, ...args) {
    const guardedListener = async (req, res) => {
      const pathname = pathnameOf(req);

      if (process.env.NODE_ENV === 'production') {
        const nonce = crypto.randomBytes(16).toString('base64');
        res.setHeader('Content-Security-Policy-Report-Only', buildCsp(nonce));
      }

      if ((req.method === 'GET' && (pathname === '/admin' || pathname === '/login')) && !String(req.headers.cookie || '').includes('assista_csrf=')) {
        issueCsrfCookie(res, createCsrfToken());
      }

      if (pathname.startsWith('/api/') && !allowRequest(req.socket?.remoteAddress || '127.0.0.1', pathname, req.method)) {
        res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Content-Type-Options': 'nosniff' });
        res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
        return;
      }

      if (isProtectedMutation(req)) {
        if (!sameOrigin(req) || !validateCsrf(req)) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
          res.end(JSON.stringify({ error: 'CSRF validation failed.' }));
          return;
        }
      }

      return requestListener(req, res);
    };
    return originalCreateServer.call(http, guardedListener, ...args);
  };
}

module.exports = { installHttpSecurity };