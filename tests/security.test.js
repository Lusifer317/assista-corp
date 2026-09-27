const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createCsrfToken, validateCsrf } = require('../lib/csrf');
const { validateLeadInput, validateAdminNote } = require('../lib/validation');
const { can, PERMISSIONS } = require('../lib/rbac');
const { buildCsp } = require('../lib/csp');

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

  console.log('Security regression tests passed.');
}

if (require.main === module) runSecurityTests();
module.exports = { runSecurityTests };