const assert = require('node:assert');
const { db } = require('../lib/db');
const { hashPassword, verifyPassword, createSession, validateSession, generateBase32Secret, generateTOTP, verifyTOTP } = require('../lib/auth');
const { createCsrfToken, validateCsrf } = require('../lib/csrf');
const { validateLeadInput, validateAdminNote } = require('../lib/validation');
const { recordSession, recordEvent, getLiveSessions } = require('../lib/analytics');
const { calculateLeadScore, getLeadScoreTier } = require('../lib/scoring');
const { logAction, getAuditLogs } = require('../lib/audit');
const { can, PERMISSIONS } = require('../lib/rbac');
const { buildCsp } = require('../lib/csp');

console.log('--- RUNNING ASSISTA CORP TEST SUITE ---');

{
  const pwd='TestSecretPassword2026!'; const {hash,salt}=hashPassword(pwd);
  assert.strictEqual(verifyPassword(pwd,hash,salt),true); assert.strictEqual(verifyPassword('WrongPassword',hash,salt),false); assert.throws(()=>hashPassword('short'),/at least 12 characters/); console.log('✓ Test 1: Password hashing and minimum length');
}
{
  const secret=generateBase32Secret(20); const code=generateTOTP(secret); assert.strictEqual(code.length,6); assert.strictEqual(verifyTOTP(secret,code),true); assert.strictEqual(verifyTOTP(secret,'000000'),false); console.log('✓ Test 2: TOTP MFA');
}
{
  const adminUser=db.prepare('SELECT id,role FROM users WHERE email=?').get('admin@assistacorp.com'); assert.ok(adminUser); const session=createSession(adminUser.id,adminUser.role); assert.ok(session.token); const validated=validateSession(session.token); assert.strictEqual(validated.email,'admin@assistacorp.com'); console.log('✓ Test 3: Sessions');
}
{
  const token=createCsrfToken(); const validReq={method:'POST',headers:{cookie:`assista_csrf=${token}`,'x-csrf-token':token}}; const invalidReq={method:'POST',headers:{cookie:`assista_csrf=${token}`,'x-csrf-token':'bad-token'}}; assert.strictEqual(validateCsrf(validReq),true); assert.strictEqual(validateCsrf(invalidReq),false); assert.strictEqual(validateCsrf({method:'GET',headers:{}}),true); console.log('✓ Test 4: CSRF');
}
{
  const valid=validateLeadInput({name:'Test Person',business_email:'test@example.com',company:'Example Co',industry:'Finance',requirements:['Finance'],team_configuration:{coverage:'Dedicated'},message:'Need support',session_id:'ses_test',turnstile_token:'token-value'}); assert.strictEqual(valid.ok,true); const invalid=validateLeadInput({name:'A',business_email:'not-an-email',company:'Example'}); assert.strictEqual(invalid.ok,false); assert.strictEqual(validateAdminNote({note:'Useful note'}).ok,true); assert.strictEqual(validateAdminNote({note:'   '}).ok,false); console.log('✓ Test 5: Input validation');
}
{
  const id='ses_test_'+Date.now(); recordSession({sessionId:id,referrer:'https://example.com',userAgent:'Mozilla/5.0 Chrome/120.0.0.0',region:'Global',consentStatus:'granted'}); recordEvent({sessionId:id,eventType:'page_view',eventData:{path:'/',title:'Home'}}); const live=getLiveSessions(30); assert.ok(live.find(s=>s.session_id===id)); console.log('✓ Test 6: Visitor tracking');
}
{
  const id='ses_score_'+Date.now(); recordSession({sessionId:id,consentStatus:'granted'}); recordEvent({sessionId:id,eventType:'behind_business_toggle',eventData:{industry:'Legal'}}); recordEvent({sessionId:id,eventType:'service_view',eventData:{category:'Specialized Support',service:'finance-accounting'}}); const score=calculateLeadScore(id,{business_email:'charles.k@kensingtoncapital.com',company:'Kensington Capital',industry:'Finance',team_configuration:JSON.stringify({disciplines:['Finance','Executive Support','Operations'],estimatedHours:40})}); assert.ok(score>=80); assert.strictEqual(getLeadScoreTier(score).tier,'Hot Intent'); console.log('✓ Test 7: Lead scoring');
}
{
  logAction({userEmail:'admin@assistacorp.com',action:'UNIT_TEST_ACTION',entityType:'test',details:{result:'ok'},ipAddress:'127.0.0.1'}); const logs=getAuditLogs(10); assert.ok(logs.find(l=>l.action==='UNIT_TEST_ACTION')); console.log('✓ Test 8: Audit logger');
}
{
  assert.equal(can('admin',PERMISSIONS.EDIT_SETTINGS),true); assert.equal(can('editor',PERMISSIONS.EDIT_CMS),true); assert.equal(can('sales',PERMISSIONS.EDIT_CMS),false); assert.equal(can('sales',PERMISSIONS.VIEW_LEADS),true); console.log('✓ Test 9: RBAC permission matrix');
}
{
  const csp=buildCsp('abc123'); assert.match(csp,/default-src 'self'/); assert.match(csp,/object-src 'none'/); assert.match(csp,/frame-ancestors 'self'/); assert.match(csp,/nonce-abc123/); console.log('✓ Test 10: CSP policy builder');
}

require('./test_logo_and_layout'); console.log('✓ Test 11: Brand logo/layout integrity');
require('./test_responsive'); console.log('✓ Test 12: Responsive architecture');

async function runAll(){const {runRouteTests}=require('./test_routes'); await runRouteTests(); console.log('✓ Test 13: Routing suite'); console.log('\nALL TESTS COMPLETED SUCCESSFULLY.');}
runAll().then(()=>process.exit(0)).catch(err=>{console.error(err);process.exit(1);});