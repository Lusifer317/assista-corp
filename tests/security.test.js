const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createCsrfToken, validateCsrf } = require('../lib/csrf');
const { validateLeadInput, validateAdminNote } = require('../lib/validation');
const { can, PERMISSIONS } = require('../lib/rbac');
const { buildCsp } = require('../lib/csp');
const { recordSession, recordEvent, updateConsent } = require('../lib/analytics');
const { db } = require('../lib/db');

function runSecurityTests() {
  const token = createCsrfToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64);

  const csrfReq = { method: 'POST', headers: { cookie: `assista_csrf=${token}`, 'x-csrf-token': token } };
  assert.equal(validateCsrf(csrfReq), true);
  assert.equal(validateCsrf({ method: 'POST', headers: { cookie: `assista_csrf=${token}`, 'x-csrf-token': crypto.randomBytes(32).toString('hex') } }), false);

  assert.equal(validateLeadInput({ name:'A', business_email:'bad', company:'C', industry:'I' }).ok, false);
  assert.equal(validateLeadInput({ name:'A', business_email:'a@example.com', company:'C', industry:'I', turnstile_token:'token-1234567890' }).ok, true);
  assert.equal(validateAdminNote({ note:'hello' }).ok, true);
  assert.equal(validateAdminNote({ note:'' }).ok, false);

  assert.equal(can('admin', PERMISSIONS.EDIT_SETTINGS), true);
  assert.equal(can('editor', PERMISSIONS.EDIT_CMS), true);
  assert.equal(can('sales', PERMISSIONS.EDIT_CMS), false);
  assert.equal(can('sales', PERMISSIONS.VIEW_LEADS), true);

  const csp = buildCsp('abc123');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /nonce-abc123/);

  const pendingId = 'ses_pending1234567890';
  assert.equal(recordSession({ sessionId: pendingId, consentStatus: 'pending' }), null, 'pending consent must not create a session');
  assert.equal(recordEvent({ sessionId: pendingId, eventType: 'page_view', eventData: { path: '/' } }), false, 'events cannot be recorded without a session');

  const grantedId = 'ses_granted1234567890';
  assert.ok(recordSession({ sessionId: grantedId, consentStatus: 'granted', referrer: 'https://example.com/path?email=private@example.com' }));
  assert.equal(recordEvent({ sessionId: grantedId, eventType: 'page_view', eventData: { path: '/contact?token=secret', title: 'Contact' } }), true);
  const storedReferrer = db.prepare('SELECT referrer FROM visitor_sessions WHERE session_id=?').get(grantedId).referrer;
  assert.equal(storedReferrer, 'https://example.com', 'referrer paths and query parameters must not be retained');
  const storedPath = JSON.parse(db.prepare('SELECT path_history FROM visitor_sessions WHERE session_id=?').get(grantedId).path_history)[0];
  assert.equal(storedPath, '/contact', 'page tracking must remove query strings and fragments');
  assert.equal(recordEvent({ sessionId: grantedId, eventType: 'arbitrary_event', eventData: {} }), false, 'unknown event types must be rejected');
  assert.equal(updateConsent(grantedId, 'rejected'), true);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM visitor_sessions WHERE session_id=?').get(grantedId).count, 0, 'withdrawal must delete anonymous session');

  console.log('Security regression tests passed.');
}

if (require.main === module) runSecurityTests();
module.exports = { runSecurityTests };