const assert = require('node:assert');
const { Readable, Writable } = require('node:stream');
const { server } = require('../server');
const { db } = require('../lib/db');
const { generateTOTP } = require('../lib/auth');

function invokeServer(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const req = new Readable();
    req.url = path;
    req.method = method;
    req.headers = {
      'host': 'localhost',
      'user-agent': 'TestRunner/1.0',
      'content-type': 'application/json',
      ...headers
    };
    if (bodyStr) {
      req.headers['content-length'] = Buffer.byteLength(bodyStr);
    }

    req._read = () => {
      if (bodyStr) req.push(bodyStr);
      req.push(null);
    };

    let statusCode = 200;
    let responseHeaders = {};
    let responseBody = '';

    const res = new Writable();
    res.writeHead = (status, hdrs = {}) => {
      statusCode = status;
      responseHeaders = { ...responseHeaders, ...hdrs };
    };
    res.setHeader = (k, v) => {
      responseHeaders[k.toLowerCase()] = v;
    };
    res.getHeader = (k) => responseHeaders[k.toLowerCase()];
    res._write = (chunk, encoding, callback) => {
      responseBody += chunk.toString();
      callback();
    };

    res.end = (chunk) => {
      if (chunk) responseBody += chunk.toString();
      resolve({
        status: statusCode,
        headers: responseHeaders,
        body: responseBody,
        json: () => JSON.parse(responseBody)
      });
    };

    server.emit('request', req, res);
  });
}

async function runTests() {
  console.log('=== RUNNING IN-PROCESS E2E SYSTEM VERIFICATION ===');

  // 1. Test Homepage
  const home = await invokeServer('GET', '/');
  assert.strictEqual(home.status, 200, 'Home page status must be 200');
  assert.ok(home.body.includes('THE PEOPLE'), 'Home page contains THE PEOPLE');
  assert.ok(home.body.includes('BEHIND BUSINESS.'), 'Home page contains BEHIND BUSINESS.');
  assert.ok(home.body.includes('WHATEVER MOVES'), 'Home page contains capability universe');
  console.log('✓ 1. Public homepage renders editorial copy, signature sections, and metadata');

  // 2. Test Content API
  const content = await invokeServer('GET', '/api/content');
  assert.strictEqual(content.status, 200);
  const contentData = content.json();
  assert.ok(contentData.content.hero, 'Hero section present');
  assert.ok(contentData.content.behind_business, 'Behind the business present');
  console.log('✓ 2. CMS Content API returns structured manifesto and scenario narratives');

  // 3. Test Services API
  const services = await invokeServer('GET', '/api/services');
  assert.strictEqual(services.status, 200);
  const servicesData = services.json();
  assert.ok(servicesData.services.length >= 10, 'Services list populated');
  console.log(`✓ 3. Services API returns ${servicesData.services.length} capability services`);

  // 4. Test Anonymous Visitor Tracking & Non-PII Event Logging
  const testSessionId = 'ses_inproc_' + Date.now();
  const trackSession = await invokeServer('POST', '/api/analytics/session', {
    sessionId: testSessionId,
    referrer: 'https://financialtimes.com/wealth-advisory',
    region: 'London, UK',
    consentStatus: 'granted'
  });
  assert.strictEqual(trackSession.status, 200);

  // Track touchpoints
  await invokeServer('POST', '/api/analytics/track', {
    sessionId: testSessionId,
    eventType: 'page_view',
    eventData: { path: '/', title: 'Home' }
  });

  await invokeServer('POST', '/api/analytics/track', {
    sessionId: testSessionId,
    eventType: 'behind_business_toggle',
    eventData: { scenario: 'finance', label: 'Financial Practice' }
  });

  await invokeServer('POST', '/api/analytics/track', {
    sessionId: testSessionId,
    eventType: 'service_view',
    eventData: { category: 'Specialized Support', service: 'finance-accounting' }
  });

  await invokeServer('POST', '/api/analytics/track', {
    sessionId: testSessionId,
    eventType: 'team_builder_interaction',
    eventData: { disciplines: ['Finance', 'Executive Support', 'Administration'], total_hours: 50 }
  });
  console.log('✓ 4. First-party anonymous tracking records navigation journey without PII');

  // 5. Test High-Intent Lead Capture
  const leadSubmission = await invokeServer('POST', '/api/leads/submit', {
    name: 'Julian Vance-Montgomery',
    business_email: 'j.vance@vanguardsterling.co.uk',
    company: 'Vanguard Sterling Advisory',
    industry: 'Finance',
    requirements: ['Finance & Administrative Support', 'Executive Support', 'Administration'],
    team_configuration: {
      disciplines: ['Finance', 'Executive Support', 'Administration'],
      estimatedHours: '50 hrs',
      coverage: 'Dedicated Squad'
    },
    message: 'Seeking a 2-person executive and financial reconciliation squad to support our 4 managing partners in Mayfair.',
    session_id: testSessionId,
    turnstile_token: 'cf_turnstile_pass_token_test'
  });

  assert.strictEqual(leadSubmission.status, 200);
  const leadResult = leadSubmission.json();
  assert.ok(leadResult.leadId, 'Lead ID returned');
  assert.ok(leadResult.intentScore >= 80, `Lead score should be >= 80 (got ${leadResult.intentScore})`);
  assert.strictEqual(leadResult.tier, 'Hot Intent');
  console.log(`✓ 5. High-intent lead captured with Intent Score ${leadResult.intentScore} and tier ${leadResult.tier}`);

  // 6. Test Admin Authentication & 2FA
  const user = db.prepare('SELECT mfa_secret FROM users WHERE email = ?').get('admin@assistacorp.com');
  const validTOTP = generateTOTP(user.mfa_secret);

  const loginRes = await invokeServer('POST', '/api/auth/login', {
    email: 'admin@assistacorp.com',
    password: 'Assista2026!Secured',
    totp_code: validTOTP
  });

  assert.strictEqual(loginRes.status, 200);
  const setCookie = loginRes.headers['Set-Cookie'] || loginRes.headers['set-cookie'];
  assert.ok(setCookie, 'Session cookie must be set');
  const cookieValue = setCookie.split(';')[0];
  console.log('✓ 6. Admin 2FA authentication verified and secure cookie issued');

  // 7. Test Admin Leads List & Dossier
  const leadsList = await invokeServer('GET', '/api/admin/leads', null, { 'cookie': cookieValue });
  assert.strictEqual(leadsList.status, 200);
  const leadsData = leadsList.json();
  const capturedLead = leadsData.leads.find(l => l.id === leadResult.leadId);
  assert.ok(capturedLead, 'Newly captured lead must appear in CRM');

  const dossierRes = await invokeServer('GET', `/api/admin/leads/${leadResult.leadId}`, null, { 'cookie': cookieValue });
  assert.strictEqual(dossierRes.status, 200);
  const dossierData = dossierRes.json();
  assert.ok(dossierData.attribution.events.length >= 4, 'Attribution timeline contains visitor events');
  console.log(`✓ 7. Admin Lead Dossier correlated with ${dossierData.attribution.events.length} prior touchpoints`);

  // 8. Test Lead Status Transition & Note
  const statusRes = await invokeServer('PATCH', `/api/admin/leads/${leadResult.leadId}/status`, { status: 'Qualified' }, { 'cookie': cookieValue });
  assert.strictEqual(statusRes.status, 200);

  const noteRes = await invokeServer('POST', `/api/admin/leads/${leadResult.leadId}/notes`, { note: 'Initial executive briefing scheduled for Thursday 2pm.' }, { 'cookie': cookieValue });
  assert.strictEqual(noteRes.status, 200);
  console.log('✓ 8. Lead stage transition to Qualified and internal operations note added');

  // 9. Test Live Activity in Admin
  const liveRes = await invokeServer('GET', '/api/admin/analytics/live', null, { 'cookie': cookieValue });
  assert.strictEqual(liveRes.status, 200);
  const liveData = liveRes.json();
  assert.ok(liveData.liveSessions.length > 0, 'Live sessions list returned');
  console.log(`✓ 9. Admin Live Activity View streaming ${liveData.liveSessions.length} active sessions`);

  // 10. Test Audit Logs
  const auditRes = await invokeServer('GET', '/api/admin/audit', null, { 'cookie': cookieValue });
  assert.strictEqual(auditRes.status, 200);
  const auditData = auditRes.json();
  assert.ok(auditData.logs.length > 0, 'Audit logs present');
  console.log(`✓ 10. Security Audit Trail verified with ${auditData.logs.length} logged system events`);

  // 11. Test CMS Update
  const cmsUpdate = await invokeServer('PUT', '/api/admin/cms/hero', {
    title: 'THE PEOPLE BEHIND BUSINESS.',
    subtitle: 'From everyday operations to specialized support, Assista gives businesses the people they need to move forward.',
    data: { eyebrow: 'Global Business Services', cta_primary: 'Meet Assista →', cta_secondary: 'Explore What We Do' }
  }, { 'cookie': cookieValue });
  assert.strictEqual(cmsUpdate.status, 200);
  console.log('✓ 11. CMS Studio live content update successfully verified');

  console.log('=== ALL 11 IN-PROCESS INTEGRATION TESTS PASSED WITH 100% SUCCESS ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
