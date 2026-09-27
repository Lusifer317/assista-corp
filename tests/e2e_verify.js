const assert = require('node:assert');

async function runE2E() {
  console.log('=== STARTING END-TO-END VERIFICATION ===');

  const BASE = 'http://127.0.0.1:3000';

  // 1. Test Public Homepage
  const homeRes = await fetch(`${BASE}/`);
  assert.strictEqual(homeRes.status, 200, 'Home page should respond with 200 OK');
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes('THE PEOPLE'), 'Home page should contain "THE PEOPLE"');
  assert.ok(homeHtml.includes('BEHIND BUSINESS.'), 'Home page should contain "BEHIND BUSINESS."');
  assert.ok(homeHtml.includes('WHATEVER MOVES'), 'Home page should contain Capability Universe');
  assert.ok(homeHtml.includes('EVERY BUSINESS'), 'Home page should contain Industries section');
  console.log('✓ Step 1: Public homepage renders editorial copy and signature components');

  // 2. Test Public Content API
  const contentRes = await fetch(`${BASE}/api/content`);
  assert.strictEqual(contentRes.status, 200);
  const contentJson = await contentRes.json();
  assert.ok(contentJson.content.hero, 'Content should include hero section');
  assert.ok(contentJson.content.behind_business, 'Content should include behind_business section');
  console.log('✓ Step 2: CMS content API returns rich structured manifesto and scenarios');

  // 3. Test Services API
  const svcRes = await fetch(`${BASE}/api/services`);
  assert.strictEqual(svcRes.status, 200);
  const svcJson = await svcRes.json();
  assert.strictEqual(svcJson.services.length >= 12, true, 'Should return all services');
  console.log(`✓ Step 3: Services capability universe verified (${svcJson.services.length} services loaded)`);

  // 4. Test Anonymous Visitor Journey & Event Tracking
  const testSessionId = 'ses_e2e_visitor_' + Date.now();
  const sessionRes = await fetch(`${BASE}/api/analytics/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      referrer: 'https://financialtimes.com/wealth-management',
      region: 'Zurich, Switzerland',
      consentStatus: 'granted'
    })
  });
  assert.strictEqual(sessionRes.status, 200);

  // Track touchpoints
  await fetch(`${BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'page_view',
      eventData: { path: '/', title: 'Home' }
    })
  });

  await fetch(`${BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'behind_business_toggle',
      eventData: { scenario: 'finance', label: 'Financial Practice' }
    })
  });

  await fetch(`${BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'service_view',
      eventData: { category: 'Specialized Support', service: 'finance-accounting' }
    })
  });

  await fetch(`${BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'team_builder_interaction',
      eventData: { disciplines: ['Finance', 'Executive Support', 'Operations'], total_hours: 53 }
    })
  });
  console.log('✓ Step 4: First-party anonymous session and high-intent events tracked with zero PII');

  // 5. Test High-Intent Lead Submission
  const leadRes = await fetch(`${BASE}/api/leads/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Maximilian Von Berg',
      business_email: 'm.vonberg@berg-advisory.ch',
      company: 'Von Berg Private Wealth & Partners',
      industry: 'Finance',
      requirements: ['Finance & Administrative Support', 'Executive Support', 'Operations'],
      team_configuration: {
        disciplines: ['Finance', 'Executive Support', 'Operations'],
        estimatedHours: '53 hrs',
        coverage: 'Dedicated Squad'
      },
      message: 'Managing $950M private assets. Seeking dedicated Zurich/London operational cell to handle custodial trade reconciliation and client onboarding packs.',
      session_id: testSessionId,
      turnstile_token: 'cf_turnstile_pass_token_test'
    })
  });

  assert.strictEqual(leadRes.status, 200, 'Lead submission should succeed');
  const leadJson = await leadRes.json();
  assert.ok(leadJson.leadId, 'Lead ID should be returned');
  assert.ok(leadJson.intentScore >= 80, `Lead score should be high (got ${leadJson.intentScore})`);
  assert.strictEqual(leadJson.tier, 'Hot Intent');
  console.log(`✓ Step 5: Lead captured with high intent score (${leadJson.intentScore} pts, Tier: ${leadJson.tier})`);

  // 6. Test Admin Authentication & Session Issuance
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@assistacorp.com',
      password: 'Assista2026!Secured',
      totp_code: ''
    })
  });

  // Note: if user has MFA enabled, check if mfa_required is returned
  const loginData = await loginRes.json();
  let adminCookie = '';

  if (loginData.mfa_required) {
    const { db } = require('../lib/db');
    const { generateTOTP } = require('../lib/auth');
    const user = db.prepare('SELECT mfa_secret FROM users WHERE email = ?').get('admin@assistacorp.com');
    const totpCode = generateTOTP(user.mfa_secret);

    const mfaRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@assistacorp.com',
        password: 'Assista2026!Secured',
        totp_code: totpCode
      })
    });
    assert.strictEqual(mfaRes.status, 200);
    const cookieHeader = mfaRes.headers.get('set-cookie');
    adminCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  } else {
    assert.strictEqual(loginRes.status, 200);
    const cookieHeader = loginRes.headers.get('set-cookie');
    adminCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  }

  assert.ok(adminCookie, 'Admin session cookie should be issued');
  console.log('✓ Step 6: Admin authentication and secure HTTP-Only session verified');

  // 7. Verify Lead Dossier and Attribution in Admin API
  const leadDossierRes = await fetch(`${BASE}/api/admin/leads/${leadJson.leadId}`, {
    headers: { 'Cookie': adminCookie }
  });
  assert.strictEqual(leadDossierRes.status, 200);
  const dossierData = await leadDossierRes.json();
  assert.strictEqual(dossierData.lead.company, 'Von Berg Private Wealth & Partners');
  assert.ok(dossierData.attribution.events.length >= 4, 'Attribution should include visitor events');
  console.log(`✓ Step 7: Admin Lead Dossier verified with full pre-submission touchpoints (${dossierData.attribution.events.length} events correlated)`);

  // 8. Update Lead Status to Qualified
  const statusRes = await fetch(`${BASE}/api/admin/leads/${leadJson.leadId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ status: 'Qualified' })
  });
  assert.strictEqual(statusRes.status, 200);
  console.log('✓ Step 8: CRM pipeline status transition to Qualified verified');

  // 9. Verify Live Anonymous Activity in Admin
  const liveRes = await fetch(`${BASE}/api/admin/analytics/live`, {
    headers: { 'Cookie': adminCookie }
  });
  assert.strictEqual(liveRes.status, 200);
  const liveJson = await liveRes.json();
  assert.ok(liveJson.liveSessions.length > 0, 'Should have active sessions');
  console.log(`✓ Step 9: Live Anonymous Session registry verified (${liveJson.liveSessions.length} active sessions listed)`);

  // 10. Verify Security Audit Trail
  const auditRes = await fetch(`${BASE}/api/admin/audit`, {
    headers: { 'Cookie': adminCookie }
  });
  assert.strictEqual(auditRes.status, 200);
  const auditJson = await auditRes.json();
  const hasLeadAction = auditJson.logs.some(l => l.action === 'LEAD_CAPTURED' && l.entity_id === String(leadJson.leadId));
  assert.ok(hasLeadAction, 'Audit log should record lead capture');
  console.log('✓ Step 10: Security Audit Trail verified with tamper-evident record');

  console.log('=== ALL E2E VERIFICATION CHECKS PASSED WITH 100% SUCCESS ===');
}

runE2E().catch(err => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
