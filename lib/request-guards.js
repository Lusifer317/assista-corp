const { verifyTurnstile } = require('./turnstile');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const STATE_CHANGING_AUTH_PATHS = new Set([
  '/api/auth/logout',
  '/api/auth/mfa/setup',
  '/api/auth/mfa/verify'
]);

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return isAllowedOrigin(req, origin);

  const referer = req.headers.referer;
  if (referer) return isAllowedOrigin(req, referer);

  // Browser navigations from the same origin normally include Origin or Referer.
  // Missing both is allowed for non-browser/API clients authenticated with a bearer token.
  return true;
}

function isAllowedOrigin(req, value) {
  try {
    const candidate = new URL(value);
    const host = req.headers.host;
    if (!host) return false;
    const expectedHost = host.split(':')[0].toLowerCase();
    return candidate.hostname.toLowerCase() === expectedHost;
  } catch {
    return false;
  }
}

function requiresOriginCheck(req) {
  if (SAFE_METHODS.has(req.method)) return false;
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  return pathname.startsWith('/api/admin/') || STATE_CHANGING_AUTH_PATHS.has(pathname);
}

async function verifyLeadTurnstile(body, req) {
  if (!body || typeof body !== 'object') return false;
  const token = body.turnstile_token;
  if (typeof token !== 'string' || token.length < 10) return false;
  return verifyTurnstile(token, req.socket?.remoteAddress || '');
}

function parseJsonBuffer(buffer) {
  try { return JSON.parse(buffer.toString('utf8') || '{}'); } catch { return null; }
}

function installRequestGuards(http) {
  if (http.__assistaRequestGuardsInstalled) return;
  http.__assistaRequestGuardsInstalled = true;
  const originalCreateServer = http.createServer;

  http.createServer = function guardedCreateServer(requestListener, ...args) {
    const guardedListener = async (req, res) => {
      const pathname = (() => {
        try { return new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname; } catch { return ''; }
      })();

      if (requiresOriginCheck(req) && !sameOrigin(req)) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        res.end(JSON.stringify({ error: 'Cross-origin request blocked.' }));
        return;
      }

      if (req.method === 'POST' && pathname === '/api/leads/submit') {
        const chunks = [];
        let size = 0;
        const MAX_BODY = 2 * 1024 * 1024;
        req.on('data', chunk => {
          size += chunk.length;
          if (size <= MAX_BODY) chunks.push(chunk);
        });
        req.on('end', async () => {
          if (size > MAX_BODY) {
            res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({ error: 'Request body too large.' }));
            return;
          }
          const buffer = Buffer.concat(chunks);
          const body = parseJsonBuffer(buffer);
          const valid = await verifyLeadTurnstile(body, req);
          if (!valid) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
            res.end(JSON.stringify({ error: 'Security verification failed.' }));
            return;
          }

          // Replay the already-consumed request body for the existing route handler.
          let delivered = false;
          const originalOn = req.on.bind(req);
          const originalOnce = req.once.bind(req);
          const listeners = [];
          req.on = (event, listener) => {
            if (event === 'data' || event === 'end') {
              listeners.push([event, listener]);
              return req;
            }
            return originalOn(event, listener);
          };
          req.once = (event, listener) => {
            if (event === 'data' || event === 'end') {
              listeners.push([event, listener]);
              return req;
            }
            return originalOnce(event, listener);
          };

          for (const [event, listener] of listeners) {
            if (event === 'data') listener(buffer);
          }
          for (const [event, listener] of listeners) {
            if (event === 'end') listener();
          }
          delivered = true;
          void delivered;
          return requestListener(req, res);
        });
        return;
      }

      return requestListener(req, res);
    };

    return originalCreateServer.call(http, guardedListener, ...args);
  };
}

module.exports = { installRequestGuards };