'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildCsp } = require('../lib/csp');

const loginHtml = fs.readFileSync(path.join(__dirname, '../views/login.html'), 'utf8');
const loginScript = fs.readFileSync(path.join(__dirname, '../public/js/login.js'), 'utf8');
const productionCsp = buildCsp('login-page-test-nonce');

assert.match(loginHtml, /<script src="\/js\/login\.js" defer><\/script>/i,
  'Login page must load its authentication code as a same-origin external script.');
assert.doesNotMatch(loginHtml, /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i,
  'Login page must not contain inline executable JavaScript blocked by production CSP.');
assert.doesNotMatch(loginHtml, /Assista2026!|Demo 2FA Code|Demo credentials|value="123456"/i,
  'Login page must not disclose seeded demo credentials or an MFA code.');
assert.match(loginScript, /fetch\(['"]\/api\/auth\/login['"]/,
  'External login script must call the login API.');
assert.match(loginScript, /mfa_required/,
  'External login script must handle the MFA challenge response.');
assert.match(productionCsp, /script-src 'self'/,
  'Production CSP must allow same-origin login JavaScript.');

console.log('✓ Operations login page CSP and credential exposure checks passed.');
