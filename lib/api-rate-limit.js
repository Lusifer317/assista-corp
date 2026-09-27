const { checkRateLimit } = require('./auth');

const LIMITS = Object.freeze({
  login: { max: 6, windowMs: 60_000 },
  leads: { max: 10, windowMs: 60_000 },
  analytics: { max: 120, windowMs: 60_000 },
  adminRead: { max: 120, windowMs: 60_000 },
  adminWrite: { max: 30, windowMs: 60_000 },
  defaultApi: { max: 120, windowMs: 60_000 }
});

function classify(pathname, method) {
  if (pathname === '/api/auth/login') return LIMITS.login;
  if (pathname === '/api/leads/submit') return LIMITS.leads;
  if (pathname.startsWith('/api/analytics/')) return LIMITS.analytics;
  if (pathname.startsWith('/api/admin/')) return method === 'GET' ? LIMITS.adminRead : LIMITS.adminWrite;
  return LIMITS.defaultApi;
}

function allowRequest(clientIp, pathname, method) {
  const policy = classify(pathname, method);
  return checkRateLimit(`${clientIp}:${pathname}`, policy.max, policy.windowMs);
}

module.exports = { LIMITS, classify, allowRequest };