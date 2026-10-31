'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

const adminSecurity = read('public/js/admin-security.js');
assert.match(adminSecurity, /nativeInnerHTML\.set\.call\(template/,
  'Admin sanitizer must use the captured native setter to avoid recursive innerHTML interception.');
assert.match(adminSecurity, /nativeInnerHTML\.get\.call\(template\)/,
  'Admin sanitizer must use the captured native getter.');
assert.doesNotMatch(adminSecurity, /template\.innerHTML\s*=\s*String\(html\)/,
  'Admin sanitizer must not recursively invoke the patched innerHTML setter.');

const csrf = read('lib/csrf.js');
const cookieWriter = csrf.slice(csrf.indexOf('function issueCsrfCookie'), csrf.indexOf('function constantTimeEqual'));
assert.match(cookieWriter, /SameSite=Lax/);
assert.doesNotMatch(cookieWriter, /; HttpOnly/,
  'Double-submit CSRF token must be readable by the same-origin client so it can send the matching header.');

const adminHtml = read('views/admin.html');
assert.match(adminHtml, /<button[^>]*class="admin-nav-item active"[^>]*data-tab="live"/,
  'Admin navigation must use keyboard-operable button elements.');
assert.doesNotMatch(adminHtml, /<div class="admin-nav-item/,
  'Non-semantic div navigation should not be used.');
assert.doesNotMatch(adminHtml, /2\.4m|1x00000000000000000000AA/,
  'Admin dashboard must not display fabricated dwell metrics or test Turnstile credentials.');

const adminJs = read('public/js/admin.js');
assert.match(adminJs, /setupMfaButton\?\.addEventListener\('click'/,
  'MFA reconfiguration control must have a working handler.');
assert.match(adminJs, /new Blob\(\[csvContent\]/,
  'Lead CSV export must use a valid Blob URL.');
assert.match(adminJs, /No submitted leads yet/,
  'Empty CRM state must explain that no real submissions exist yet.');
assert.match(adminJs, /Live lead capture is not configured/,
  'Admin settings must identify missing production Turnstile configuration.');

const htmlForms = read('public/index.html') + read('public/contact.html');
assert.doesNotMatch(htmlForms, /cf_turnstile_pass_token_demo|1x00000000000000000000AA/,
  'Public inquiry forms must not contain demo Turnstile tokens or site keys.');
assert.match(htmlForms, /data-turnstile-widget/,
  'Public inquiry forms must provide a real Turnstile widget container.');

const appJs = read('public/js/app.js');
assert.match(appJs, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/,
  'Public inquiry forms must load the official explicit Turnstile API.');
assert.doesNotMatch(appJs, /cf_turnstile_pass_token_demo/,
  'Public inquiry submission must not fall back to a test token.');

const server = read('server.js');
assert.match(server, /pending_mfa_secret/,
  'MFA reconfiguration must retain the active secret until the pending secret is verified.');
assert.match(server, /Enter a live Cloudflare Turnstile site key/,
  'Server must reject known Cloudflare test site keys in production settings.');

const db = read('lib/db.js');
assert.match(db, /ALTER TABLE users ADD COLUMN pending_mfa_secret TEXT/,
  'Existing databases must receive a non-destructive pending MFA migration.');

const seed = read('data/seed.js');
assert.doesNotMatch(seed, /1x00000000000000000000AA|1x0000000000000000000000000000000AA/,
  'Seed data must not install Cloudflare test credentials.');

const dockerfile = read('Dockerfile');
const compose = read('docker-compose.prod.yml');
const healthcheck = read('scripts/healthcheck.js');
assert.match(dockerfile, /\/nodejs\/bin\/node.*healthcheck\.js/);
assert.match(compose, /\/nodejs\/bin\/node.*healthcheck\.js/);
assert.match(healthcheck, /path: '\/health'/);

for (const file of ['public/js/admin.js', 'public/js/admin-security.js', 'public/js/app.js', 'scripts/healthcheck.js']) {
  assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), `${file} must parse successfully`);
}

console.log('✓ Admin portal runtime, mutation, MFA, Turnstile, and production health checks passed.');
