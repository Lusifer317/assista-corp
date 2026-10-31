'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const adminSecurity = fs.readFileSync(path.join(__dirname, '../public/js/admin-security.js'), 'utf8');
const csrfModule = fs.readFileSync(path.join(__dirname, '../lib/csrf.js'), 'utf8');
const httpSecurity = fs.readFileSync(path.join(__dirname, '../lib/http-security.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf8');

assert.match(adminHtml, /\/js\/admin-security\.js/);
assert.match(adminHtml, /\/js\/admin\.js/);

// Captured native accessors prevent the Element.innerHTML override from
// recursively invoking itself while parsing its detached template.
assert.match(adminSecurity, /nativeInnerHTML\.set\.call\(template,/);
assert.match(adminSecurity, /nativeInnerHTML\.get\.call\(template\)/);
assert.match(adminSecurity, /nativeInnerHTML\.set\.call\(this,\s*sanitizeHtml\(value\)\)/);

// The double-submit token must be readable by same-origin JS; the auth
// session cookie remains HttpOnly and is enforced separately.
const csrfCookieDefinition = csrfModule.split('\n').find(line => line.includes("res.setHeader('Set-Cookie'"));
assert.ok(csrfCookieDefinition, 'CSRF cookie must be issued');
assert.doesNotMatch(csrfCookieDefinition, /HttpOnly/i, 'CSRF token must be readable by same-origin JS');
assert.match(httpSecurity, /issueCsrfCookie\(res,\s*createCsrfToken\(\)\)/, 'Admin/login requests must rotate the CSRF cookie');
assert.match(adminSecurity, /X-CSRF-Token/);
assert.match(adminSecurity, /assista_csrf=/);

console.log('✓ Admin portal sanitizer recursion and CSRF client/server contract checks passed.');
