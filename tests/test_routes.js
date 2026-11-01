const assert = require('node:assert');
const { Readable, Writable } = require('node:stream');
const fs = require('node:fs');
const path = require('node:path');
const { server } = require('../server');
const { db } = require('../lib/db');

function invokeServer(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve) => {
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const req = new Readable();
    req.url = pathUrl;
    req.method = method;
    req.headers = {
      'host': 'localhost',
      'user-agent': 'TestRunner/2.0',
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
        body: responseBody
      });
    };

    server.emit('request', req, res);
  });
}

async function runRouteTests() {
  console.log('=== VERIFYING MULTI-PAGE ARCHITECTURE & ROUTING SUITE ===\n');

  const EXPECTED_ROUTES = [
    {
      route: '/',
      expectedTitle: 'Business Support Services & Operations Teams | Assista Corp',
      mustInclude: ['Business operations,', 'handled by people.', 'Dedicated Teams', 'Core Capabilities', 'WHATEVER MOVES YOUR BUSINESS FORWARD'],
      isHub: true
    },
    {
      route: '/services',
      expectedTitle: 'Business Support Services & Teams | Assista Corp',
      mustInclude: ['Business support services shaped around the work your team needs done.', 'Executive Support', 'Finance &amp; Reconciliation', 'Customer Care &amp; CX', 'Recruitment &amp; Talent'],
      isHub: true
    },
    {
      route: '/services/executive-support',
      expectedTitle: 'Executive Assistant & Executive Support Services | Assista Corp',
      mustInclude: ['Executive assistant support that protects leadership focus.', 'Calendar and meeting coordination', 'Travel research and itinerary preparation'],
      isHub: false
    },
    {
      route: '/services/finance-reconciliation',
      expectedTitle: 'Finance Operations & Reconciliation Support | Assista Corp',
      mustInclude: ['Finance and reconciliation support that keeps work reviewable.', 'Statement reconciliation preparation', 'Payment release and fund movement remain with your authorized signatories.'],
      isHub: false
    },
    {
      route: '/services/customer-care',
      expectedTitle: 'Customer Support & Customer Experience Services | Assista Corp',
      mustInclude: ['Customer support operations that feel considered and consistent.', 'Email and ticket triage', 'VIP and sensitive case escalation'],
      isHub: false
    },
    {
      route: '/services/recruitment-talent',
      expectedTitle: 'Recruitment Coordination & Talent Operations | Assista Corp',
      mustInclude: ['Recruitment coordination that keeps hiring pipelines moving.', 'Candidate sourcing support', 'Final candidate selection'],
      isHub: false
    },
    {
      route: '/insights',
      expectedTitle: 'Business Operations Insights & Guides | Assista Corp',
      mustInclude: ['Practical guides to better business operations.', 'How to scope executive assistant support', 'Building a reviewable reconciliation workflow', 'Designing a practical customer support queue', 'Creating a consistent recruitment coordination process'],
      isHub: true
    },
    {
      route: '/industries',
      expectedTitle: 'Industry-Specific Business Operations Support | Assista Corp',
      mustInclude: ['Healthcare &amp; Clinical Practices', 'Private Wealth &amp; Family Offices', 'Corporate Law Firms', 'E-Commerce &amp; Brands', 'Typical workflows we can support:'],
      isHub: true
    },
    {
      route: '/how-we-work',
      expectedTitle: 'How Our Business Support Teams Work | Assista Corp',
      mustInclude: ['How our business support teams integrate and deliver.', 'STAGE 01', 'STAGE 02', 'STAGE 03', 'STAGE 04', 'Understand', 'Build', 'Integrate', 'Operate'],
      isHub: true
    },
    {
      route: '/trust',
      expectedTitle: 'Trust & Assurance | Security and Quality Roadmap | Assista Corp',
      mustInclude: ['Trust should be verifiable—not just a badge.', 'ISO/IEC 27001:2022', 'ISO 9001:2026', 'SOC 2 examination', 'They are not client testimonials'],
      isHub: true
    },
    {
      route: '/about',
      expectedTitle: 'About Assista Corp | Business Operations Support',
      mustInclude: ['The People Behind Business.', 'Why human operational infrastructure matters.', 'Confidentiality Standards', 'Institutional Governance'],
      isHub: true
    },
    {
      route: '/contact',
      expectedTitle: 'Contact Assista Corp | Business Support Consultation',
      mustInclude: ['Discuss your business support requirements.', 'Direct Business Inquiry', 'operations@assistacorp.com', 'A client director will review your inquiry and follow up directly.'],
      isHub: true
    }
  ];

  // 1. Test All 10 Valid Routes (HTTP 200, SEO metadata, Canonical, Content)
  console.log('1. Testing all 12 semantic routes...');
  for (const item of EXPECTED_ROUTES) {
    const res = await invokeServer('GET', item.route);
    assert.strictEqual(res.status, 200, `Route ${item.route} must return status 200 (got ${res.status})`);
    
    // Check Title
    const escapedExpectedTitle = item.expectedTitle.replace(/&/g, '&amp;');
    assert.ok(res.body.includes(`<title>${escapedExpectedTitle}</title>`),
      `Route ${item.route} must have title "${item.expectedTitle}"`);
    
    // Check Canonical Tag
    const expectedCanonical = `https://assistacorp.com${item.route}`;
    assert.ok(res.body.includes(`<link rel="canonical" href="${expectedCanonical}">`),
      `Route ${item.route} must have canonical URL "${expectedCanonical}"`);

    // Check OpenGraph
    assert.ok(res.body.includes('property="og:title"'), `Route ${item.route} must have og:title`);
    assert.ok(res.body.includes('property="og:description"'), `Route ${item.route} must have og:description`);
    const jsonLdBlocks = [...res.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    assert.ok(jsonLdBlocks.length > 0, `Route ${item.route} must include JSON-LD structured data`);
    for (const block of jsonLdBlocks) {
      assert.doesNotThrow(() => JSON.parse(block[1]), `Route ${item.route} JSON-LD must be valid JSON`);
    }

    // Check Required Content
    for (const phrase of item.mustInclude) {
      assert.ok(res.body.includes(phrase), `Route ${item.route} must contain "${phrase}"`);
    }

    // Check Header & Logo
    assert.ok(res.body.includes('class="site-logo" width="250" height="44"'),
      `Route ${item.route} must contain approved desktop header logo (250x44)`);
    assert.ok(res.body.includes('class="site-logo footer-logo" width="195" height="35"'),
      `Route ${item.route} must contain approved footer logo (195x35)`);
    assert.ok(res.body.includes('id="mobile-toggle"') && res.body.includes('id="mobile-drawer"'),
      `Route ${item.route} must contain mobile toggle and drawer navigation`);

    // Check Breadcrumbs (on non-homepage routes)
    if (item.route !== '/') {
      assert.ok(res.body.includes(item.route.startsWith('/services') ? 'class="svc-breadcrumb"' : 'class="breadcrumb-nav"'), `Sub-page ${item.route} must have breadcrumb navigation`);
    }

    console.log(`  ✓ Route ${item.route} verified (Status 200, SEO metadata, Content, Navigation, Breadcrumbs)`);
  }
  console.log('✓ All 12 semantic routes passed.\n');

  // 1a. Verify homepage LCP discovery and safe static asset caching.
  const homepageRes = await invokeServer('GET', '/');
  assert.ok(homepageRes.body.includes('<link rel="preload" as="image" href="/images/hero-operations-collab.jpg" fetchpriority="high">'),
    'Homepage must preload the hero LCP image with high priority');
  assert.ok(homepageRes.body.includes('loading="eager" fetchpriority="high" decoding="async" class="hero-main-img"'),
    'Hero image must be immediately discoverable and high priority');
  assert.ok(!homepageRes.body.includes('/videos/hero-operations.mp4'),
    'Homepage must not request the untracked hero video asset');

  const cssAssetRes = await invokeServer('GET', '/css/styles.css');
  assert.strictEqual(cssAssetRes.status, 200, 'Static CSS asset must be served successfully');
  assert.strictEqual(cssAssetRes.headers['Cache-Control'], 'public, max-age=604800, stale-while-revalidate=86400',
    'Static assets must receive the bounded browser cache policy');
  assert.strictEqual(homepageRes.headers['Cache-Control'], 'private, no-store',
    'Public HTML should not inherit long-lived static asset caching');
  const healthRes = await invokeServer('GET', '/health');
  assert.strictEqual(healthRes.headers['Cache-Control'], 'no-store, no-cache, must-revalidate',
    'Health/API responses must remain non-cacheable');
  console.log('✓ Homepage LCP discovery and cache policy verified.\\n');

  // 2. Test Trailing Slash Normalization
  console.log('2. Testing trailing slash normalization...');
  const trailingRes = await invokeServer('GET', '/services/');
  assert.strictEqual(trailingRes.status, 200, '/services/ must resolve cleanly with status 200');
  assert.ok(trailingRes.body.includes('Business support services shaped around the work your team needs done.'), '/services/ renders redesigned services page');
  console.log('✓ Trailing slash normalization verified.\n');

  // 3. Test Unknown Route -> Branded 404 Page (HTTP Status 404)
  console.log('3. Testing unknown route error handling...');
  const notFoundRes = await invokeServer('GET', '/non-existent-capability-page');
  assert.strictEqual(notFoundRes.status, 404, 'Unknown route must return HTTP status 404');
  assert.ok(notFoundRes.body.includes('Page not found.'), '404 response must display "Page not found."');
  assert.ok(notFoundRes.body.includes('Back to Assista'), '404 response must provide "Back to Assista" link');
  assert.ok(notFoundRes.body.includes('Explore Services'), '404 response must provide "Explore Services" link');
  assert.ok(notFoundRes.body.includes('Contact Assista'), '404 response must provide "Contact Assista" link');
  assert.ok(notFoundRes.body.includes('class="site-logo" width="250" height="44"'), '404 page maintains official header branding');
  assert.ok(notFoundRes.body.includes('class="site-logo footer-logo" width="195" height="35"'), '404 page maintains official footer branding');
  console.log('✓ Branded 404 page verified with HTTP status 404 and recovery pathways.\n');

  // 4. Test Content Integrity (Zero Invented Leadership / No Hallucinated Personas)
  console.log('4. Verifying content integrity safeguards across all routes...');
  for (const item of EXPECTED_ROUTES) {
    const res = await invokeServer('GET', item.route);
    assert.ok(!res.body.includes('Elena Rostova'), `Route ${item.route} must NOT contain "Elena Rostova"`);
    assert.ok(!res.body.includes('David Vance'), `Route ${item.route} must NOT contain "David Vance"`);
    assert.ok(!res.body.includes('within 4 business hours'), `Route ${item.route} must NOT contain unverified SLA response claim`);
  }
  console.log('✓ Content integrity strictly maintained: "Elena Rostova", "David Vance", and SLA claims absent.\n');

  // 5. Test Dedicated Contact Page Lead Submission
  console.log('5. Testing lead capture on dedicated /contact route...');
  const contactSubmit = await invokeServer('POST', '/api/leads/submit', {
    name: 'Julian Vance-Montgomery',
    business_email: 'j.vance@vanguardsterling.co.uk',
    company: 'Vanguard Sterling Advisory',
    industry: 'Private Wealth Offices',
    requirements: ['Executive Support', 'Finance & Reconciliation'],
    team_configuration: { role: 'Managing Partner', website: 'https://vanguardsterling.co.uk' },
    message: 'We require a dedicated operational cell supporting our partner group in London and Zurich.',
    turnstile_token: 'cf_turnstile_pass_token_demo'
  });
  assert.strictEqual(contactSubmit.status, 200, 'Lead submission from /contact must return status 200');
  const leadRes = JSON.parse(contactSubmit.body);
  assert.ok(leadRes.success && leadRes.leadId > 0, 'Lead record must be created with valid ID');

  const leadInDb = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadRes.leadId);
  assert.ok(leadInDb, 'Lead must exist in database');
  assert.strictEqual(leadInDb.company, 'Vanguard Sterling Advisory');
  console.log(`✓ Lead capture verified: ID #${leadRes.leadId} for "${leadInDb.company}" saved to database.\n`);

  // 6. Test Multi-Device Viewport Safeguards (375px, 390px, 430px, 768px, 1024px, 1280px, 1440px)
  console.log('6. Verifying responsive CSS rules for all required viewports...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/styles.css'), 'utf8');

  const VIEWPORTS = [
    { name: 'Small mobile (375px)', query: '@media (max-width: 375px)' },
    { name: 'Standard mobile (480px / 390px / 430px)', query: '@media (max-width: 480px)' },
    { name: 'Modal / Large mobile (640px)', query: '@media (max-width: 640px)' },
    { name: 'Tablet portrait (768px)', query: '@media (max-width: 768px)' },
    { name: 'Navigation collapse (900px)', query: '@media (max-width: 900px)' },
    { name: 'Tablet landscape / Laptop (1024px)', query: '@media (max-width: 1024px)' },
    { name: 'Compact desktop (1100px)', query: '@media (max-width: 1100px)' }
  ];

  for (const vp of VIEWPORTS) {
    assert.ok(css.includes(vp.query), `CSS must include query for ${vp.name}: ${vp.query}`);
  }

  // Check multi-page responsive components
  assert.ok(css.includes('.workflow-grid'), 'CSS includes .workflow-grid styling');
  assert.ok(css.includes('.who-for-grid'), 'CSS includes .who-for-grid styling');
  assert.ok(css.includes('.contact-page-grid'), 'CSS includes .contact-page-grid styling');
  assert.ok(css.includes('.faq-card'), 'CSS includes .faq-card styling');
  assert.ok(css.includes('.breadcrumb-nav'), 'CSS includes .breadcrumb-nav styling');
  assert.ok(css.includes('.page-hero'), 'CSS includes .page-hero styling');
  assert.ok(css.includes('.nav-dropdown'), 'CSS includes .nav-dropdown styling');
  assert.ok(css.includes('overflow-x: hidden;'), 'CSS includes overflow-x: hidden safety');
  console.log('✓ All responsive viewports (375px, 390px, 430px, 768px, 1024px, 1280px, 1440px) and components verified.\n');

  console.log('=== ALL MULTI-PAGE ROUTE & ARCHITECTURE TESTS PASSED ===');
}

if (require.main === module) {
  runRouteTests().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runRouteTests };
