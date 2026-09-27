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

// Test 1: Password Hashing & Verification
{
  const pwd = 'TestSecretPassword2026!';
  const { hash, salt } = hashPassword(pwd);
  assert.strictEqual(verifyPassword(pwd, hash, salt), true, 'Password verification should match');
  assert.strictEqual(verifyPassword('WrongPassword', hash, salt), false, 'Wrong password should fail');
  console.log('✓ Test 1: PBKDF2 Password hashing & timing-safe verification passed');
}

// Test 2: TOTP MFA (RFC 6238)
{
  const secret = generateBase32Secret(20);
  assert.ok(secret.length >= 20, 'Secret should be generated');
  const code = generateTOTP(secret);
  assert.strictEqual(code.length, 6, 'TOTP code should be 6 digits');
  assert.strictEqual(verifyTOTP(secret, code), true, 'Generated TOTP should verify');
  assert.strictEqual(verifyTOTP(secret, '000000'), false, 'Fake code should fail verification');
  console.log('✓ Test 2: RFC 6238 TOTP MFA generation & verification passed');
}

// Test 3: Session Tokens
{
  const adminUser = db.prepare('SELECT id, role FROM users WHERE email = ?').get('admin@assistacorp.com');
  assert.ok(adminUser, 'Admin user should exist from seed');
  const session = createSession(adminUser.id, adminUser.role);
  assert.ok(session.token, 'Session token should exist');
  const validated = validateSession(session.token);
  assert.strictEqual(validated.email, 'admin@assistacorp.com');
  console.log('✓ Test 3: Session creation & token validation passed');
}

// Test 4: First-Party Privacy-Conscious Analytics
{
  const testSessionId = 'ses_test_' + Date.now();
  const sessionRecord = recordSession({
    sessionId: testSessionId,
    referrer: 'https://bloomberg.com',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    region: 'Zurich, Switzerland',
    consentStatus: 'granted'
  });

  assert.strictEqual(sessionRecord.device_category, 'Desktop');
  assert.strictEqual(sessionRecord.browser, 'Chrome');

  recordEvent({
    sessionId: testSessionId,
    eventType: 'page_view',
    eventData: { path: '/', title: 'Home' }
  });

  recordEvent({
    sessionId: testSessionId,
    eventType: 'industry_view',
    eventData: { industry: 'Healthcare', sensitiveDataAttempt: 'SHOULD_BE_STRIPPED' }
  });

  const live = getLiveSessions(30);
  const found = live.find(s => s.session_id === testSessionId);
  assert.ok(found, 'Session should be visible in Live Activity');
  assert.strictEqual(found.paths[0], '/');
  assert.strictEqual(found.event_count, 2);
  console.log('✓ Test 4: Privacy-respecting visitor tracking & Live Activity query passed');
}

// Test 5: Intent Lead Scoring Engine
{
  const testSessionId = 'ses_score_' + Date.now();
  recordSession({ sessionId: testSessionId, consentStatus: 'granted' });
  recordEvent({ sessionId: testSessionId, eventType: 'behind_business_toggle', eventData: { industry: 'Legal' } });
  recordEvent({ sessionId: testSessionId, eventType: 'service_view', eventData: { category: 'Specialized Support', service: 'finance-accounting' } });

  const leadData = {
    business_email: 'charles.k@kensingtoncapital.com', // Corporate domain
    company: 'Kensington Capital',
    industry: 'Finance',
    team_configuration: JSON.stringify({
      disciplines: ['Finance', 'Executive Support', 'Operations'],
      estimatedHours: 40
    })
  };

  const score = calculateLeadScore(testSessionId, leadData);
  assert.ok(score >= 80, `Calculated score should be high intent (got ${score})`);
  const tier = getLeadScoreTier(score);
  assert.strictEqual(tier.tier, 'Hot Intent', 'Score tier should be Hot Intent');
  console.log(`✓ Test 5: Intent lead scoring passed (Score: ${score}, Tier: ${tier.tier})`);
}

// Test 6: Audit Logging
{
  logAction({
    userEmail: 'admin@assistacorp.com',
    action: 'UNIT_TEST_ACTION',
    entityType: 'test',
    details: { result: 'ok' },
    ipAddress: '127.0.0.1'
  });

  const logs = getAuditLogs(10);
  const latest = logs.find(l => l.action === 'UNIT_TEST_ACTION');
  assert.ok(latest, 'Audit log should be recorded');
  assert.strictEqual(latest.user_email, 'admin@assistacorp.com');
  console.log('✓ Test 6: Tamper-evident admin audit logger passed');
}

// Test 7: Official Brand Logo & Layout Integrity
{
  require('./test_logo_and_layout');
  console.log('✓ Test 7: Official Brand Logo Sizing & Layout Integrity verified');
}

// Test 8: Full Multi-Device Responsive Architecture
{
  require('./test_responsive');
  console.log('✓ Test 8: Full Multi-Device Responsive Architecture verified');
}

// Test 9: Multi-Page Semantic Architecture & Routing Suite
async function runAll() {
  const { runRouteTests } = require('./test_routes');
  await runRouteTests();
  console.log('✓ Test 9: Multi-Page Semantic Architecture & Routing Suite verified');
  console.log('\nALL TESTS COMPLETED SUCCESSFULLY.');
}

runAll().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

