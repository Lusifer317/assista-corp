const assert = require('node:assert');
const { db } = require('../lib/db');
const {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  generateBase32Secret,
  generateTOTP,
  verifyTOTP
} = require('../lib/auth');
const { createCsrfToken, validateCsrf } = require('../lib/csrf');
const { validateLeadInput, validateAdminNote } = require('../lib/validation');
const {
  recordSession,
  recordEvent,
  updateConsent,
  getLiveSessions,
  getAnalyticsOverview
} = require('../lib/analytics');
const {
  calculateLeadScore,
  getLeadScoreTier,
  linkSessionToLead,
  getLeadAttribution
} = require('../lib/scoring');
const { logAction, getAuditLogs } = require('../lib/audit');

console.log('--- RUNNING ASSISTA CORP TEST SUITE ---');

{
  const pwd = 'TestSecretPassword2026!';
  const { hash, salt } = hashPassword(pwd);
  assert.strictEqual(verifyPassword(pwd, hash, salt), true);
  assert.strictEqual(verifyPassword('WrongPassword', hash, salt), false);
  assert.throws(() => hashPassword('short'), /at least 12 characters/);
  console.log('✓ Test 1: PBKDF2 password hashing, verification & minimum length passed');
}

{
  const secret = generateBase32Secret(20);
  const code = generateTOTP(secret);
  assert.strictEqual(code.length, 6);
  assert.strictEqual(verifyTOTP(secret, code), true);
  assert.strictEqual(verifyTOTP(secret, '000000'), false);
  console.log('✓ Test 2: RFC 6238 TOTP MFA generation & verification passed');
}

{
  const adminUser = db.prepare('SELECT id, role FROM users WHERE email = ?').get('admin@assistacorp.com');
  assert.ok(adminUser);
  const session = createSession(adminUser.id, adminUser.role);
  assert.ok(session.token);
  const validated = validateSession(session.token);
  assert.strictEqual(validated.email, 'admin@assistacorp.com');
  console.log('✓ Test 3: Session creation & token validation passed');
}

{
  const token = createCsrfToken();
  assert.strictEqual(token.length, 64);
  const validReq = { method: 'POST', headers: { cookie: `assista_csrf=${token}`, 'x-csrf-token': token } };
  const invalidReq = { method: 'POST', headers: { cookie: `assista_csrf=${token}`, 'x-csrf-token': 'bad-token' } };
  assert.strictEqual(validateCsrf(validReq), true);
  assert.strictEqual(validateCsrf(invalidReq), false);
  assert.strictEqual(validateCsrf({ method: 'GET', headers: {} }), true);
  console.log('✓ Test 4: CSRF token generation and constant-time validation passed');
}

{
  const valid = validateLeadInput({
    name: 'Test Person', business_email: 'test@example.com', company: 'Example Co',
    industry: 'Finance', requirements: ['Finance', 'Operations'], team_configuration: { coverage: 'Dedicated' },
    message: 'Need support', session_id: 'ses_test', turnstile_token: 'token-value'
  });
  assert.strictEqual(valid.ok, true);
  assert.strictEqual(valid.value.business_email, 'test@example.com');
  const invalid = validateLeadInput({ name: 'A', business_email: 'not-an-email', company: 'Example' });
  assert.strictEqual(invalid.ok, false);
  assert.strictEqual(validateAdminNote({ note: 'A useful internal note' }).ok, true);
  assert.strictEqual(validateAdminNote({ note: '   ' }).ok, false);
  console.log('✓ Test 5: Lead and admin-note validation passed');
}

{
  const testSessionId = 'ses_test_' + Date.now();
  const sessionRecord = recordSession({ sessionId: testSessionId, referrer: 'https://bloomberg.com', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', region: 'Global', consentStatus: 'granted' });
  assert.strictEqual(sessionRecord.device_category, 'Desktop');
  assert.strictEqual(sessionRecord.browser, 'Chrome');
  recordEvent({ sessionId: testSessionId, eventType: 'page_view', eventData: { path: '/', title: 'Home' } });
  recordEvent({ sessionId: testSessionId, eventType: 'industry_view', eventData: { industry: 'Healthcare', sensitiveDataAttempt: 'SHOULD_BE_STRIPPED' } });
  const live = getLiveSessions(30);
  const found = live.find(s => s.session_id === testSessionId);
  assert.ok(found);
  assert.strictEqual(found.paths[0], '/');
  assert.strictEqual(found.event_count, 2);
  console.log('✓ Test 6: Privacy-conscious visitor tracking & Live Activity query passed');
}

{
  const testSessionId = 'ses_score_' + Date.now();
  recordSession({ sessionId: testSessionId, consentStatus: 'granted' });
  recordEvent({ sessionId: testSessionId, eventType: 'behind_business_toggle', eventData: { industry: 'Legal' } });
  recordEvent({ sessionId: testSessionId, eventType: 'service_view', eventData: { category: 'Specialized Support', service: 'finance-accounting' } });
  const leadData = { business_email: 'charles.k@kensingtoncapital.com', company: 'Kensington Capital', industry: 'Finance', team_configuration: JSON.stringify({ disciplines: ['Finance', 'Executive Support', 'Operations'], estimatedHours: 40 }) };
  const score = calculateLeadScore(testSessionId, leadData);
  assert.ok(score >= 80, `Calculated score should be high intent (got ${score})`);
  const tier = getLeadScoreTier(score);
  assert.strictEqual(tier.tier, 'Hot Intent');
  console.log(`✓ Test 7: Intent lead scoring passed (Score: ${score}, Tier: ${tier.tier})`);
}

{
  logAction({ userEmail: 'admin@assistacorp.com', action: 'UNIT_TEST_ACTION', entityType: 'test', details: { result: 'ok' }, ipAddress: '127.0.0.1' });
  const logs = getAuditLogs(10);
  const latest = logs.find(l => l.action === 'UNIT_TEST_ACTION');
  assert.ok(latest);
  assert.strictEqual(latest.user_email, 'admin@assistacorp.com');
  console.log('✓ Test 8: Admin audit logger passed');
}

{
  require('./test_logo_and_layout');
  console.log('✓ Test 9: Official Brand Logo Sizing & Layout Integrity verified');
}

{
  require('./test_responsive');
  console.log('✓ Test 10: Full Multi-Device Responsive Architecture verified');
}

async function runAll() {
  const { runRouteTests } = require('./test_routes');
  await runRouteTests();
  console.log('✓ Test 11: Multi-Page Semantic Architecture & Routing Suite verified');
  console.log('\nALL TESTS COMPLETED SUCCESSFULLY.');
}

runAll().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
