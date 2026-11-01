const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const { getClientIp } = require('./lib/client-ip');
const { installHttpSecurity } = require('./lib/http-security');
installHttpSecurity();

const { db } = require('./lib/db');
const { hashPassword, verifyPassword, createSession, validateSession, destroySession, checkRateLimit, generateBase32Secret, verifyTOTP, parseCookies } = require('./lib/auth');
const { recordSession, recordEvent, updateConsent, getLiveSessions, getAnalyticsOverview } = require('./lib/analytics');
const { calculateLeadScore, getLeadScoreTier, linkSessionToLead, getLeadAttribution } = require('./lib/scoring');
const { sendSalesNotification } = require('./lib/mailer');
const { logAction, getAuditLogs } = require('./lib/audit');
const { verifyTurnstile } = require('./lib/turnstile');
const { validateLeadInput, validateAdminNote } = require('./lib/validation');
const { PERMISSIONS, requirePermission } = require('./lib/rbac');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');
const PUBLIC_ROUTES = {
  '/': path.join(PUBLIC_DIR, 'index.html'),
  '/services': path.join(PUBLIC_DIR, 'services', 'index.html'),
  '/insights': path.join(PUBLIC_DIR, 'insights', 'index.html'),
  '/services/executive-support': path.join(PUBLIC_DIR, 'services', 'executive-support.html'),
  '/services/finance-reconciliation': path.join(PUBLIC_DIR, 'services', 'finance-reconciliation.html'),
  '/services/customer-care': path.join(PUBLIC_DIR, 'services', 'customer-care.html'),
  '/services/recruitment-talent': path.join(PUBLIC_DIR, 'services', 'recruitment-talent.html'),
  '/industries': path.join(PUBLIC_DIR, 'industries.html'),
  '/how-we-work': path.join(PUBLIC_DIR, 'how-we-work.html'),
  '/about': path.join(PUBLIC_DIR, 'about.html'),
  '/trust': path.join(PUBLIC_DIR, 'trust.html'),
  '/contact': path.join(PUBLIC_DIR, 'contact.html')
};
const MIME_TYPES = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.woff':'font/woff' };

function parseBody(req) { return new Promise(resolve => { let body=''; req.on('data', chunk => { body += chunk; if (body.length > 2*1024*1024) req.destroy(); }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } }); req.on('error', () => resolve({})); }); }
function sendJSON(res, data, statusCode=200) { res.writeHead(statusCode, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); }
function sendError(res, message, statusCode=400) { sendJSON(res,{error:message},statusCode); }
function sendFile(res, filePath, contentType, statusCode=200, cacheControl='private, no-store') { fs.readFile(filePath,(err,content)=>{ if(err){res.writeHead(404,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('404 Not Found');return;} const headers={'Content-Type':contentType,'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Cache-Control':cacheControl};res.writeHead(statusCode,headers);res.end(content); }); }
function authenticate(req) { const cookies=parseCookies(req); const token=cookies.assista_session||req.headers['authorization']?.replace(/^Bearer\s+/i,''); return validateSession(token); }
function requirePermissionOr403(res,user,permission) { if(!requirePermission(user,permission)){sendError(res,'Access denied.',403);return false;} return true; }
function boundedText(value, maxLength, required = false) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  if (clean.length > maxLength || (required && !clean)) return null;
  return clean;
}
function boundedStringArray(value, maxItems, maxItemLength) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const clean = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length > maxItemLength) return null;
    const normalized = item.trim();
    if (normalized) clean.push(normalized);
  }
  return clean;
}
function safeHttpsUrl(value, maxLength = 500) {
  const clean = boundedText(value, maxLength);
  if (clean === null || clean === '') return clean;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.toString() : null;
  } catch { return null; }
}

const server=http.createServer(async(req,res)=>{
  const parsedUrl=url.parse(req.url,true); const pathname=parsedUrl.pathname; const method=req.method; const clientIp=getClientIp(req);
  res.setHeader('X-Frame-Options','SAMEORIGIN'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','strict-origin-when-cross-origin'); res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()'); res.setHeader('X-XSS-Protection','0');
  if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  try {
    const cleanPath=pathname.length>1&&pathname.endsWith('/')?pathname.slice(0,-1):pathname;
    if(method==='GET'&&PUBLIC_ROUTES[cleanPath])return sendFile(res,PUBLIC_ROUTES[cleanPath],'text/html; charset=utf-8');
    if(method==='GET'&&cleanPath==='/admin'){const user=authenticate(req);if(!user){res.writeHead(302,{Location:'/login'});res.end();return;}return sendFile(res,path.join(VIEWS_DIR,'admin.html'),'text/html; charset=utf-8');}
    if(method==='GET'&&cleanPath==='/login'){const user=authenticate(req);if(user){res.writeHead(302,{Location:'/admin'});res.end();return;}return sendFile(res,path.join(VIEWS_DIR,'login.html'),'text/html; charset=utf-8');}
    if(method==='GET'&&!pathname.startsWith('/api/')){const safePath=path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');const filePath=path.join(PUBLIC_DIR,safePath);const ext=path.extname(filePath).toLowerCase();if(fs.existsSync(filePath)&&fs.statSync(filePath).isFile()){const cacheableExtensions=new Set(['.css','.js','.svg','.png','.jpg','.jpeg','.webp','.ico','.woff','.woff2']);const cacheControl=cacheableExtensions.has(ext)?'public, max-age=604800, stale-while-revalidate=86400':'private, no-store';return sendFile(res,filePath,MIME_TYPES[ext]||'application/octet-stream',200,cacheControl);}}

    if(method==='GET'&&pathname==='/health'){return sendJSON(res,{status:'ok'});}
    if(method==='GET'&&pathname==='/health/ready'){try { db.prepare('SELECT 1').get(); return sendJSON(res,{status:'ready'}); } catch { return sendError(res,'Service unavailable.',503); }}
    if(method==='GET'&&pathname==='/api/content'){const rows=db.prepare('SELECT section_key,title,subtitle,content_json FROM cms_content').all();const content={};rows.forEach(r=>{let parsed={};try{parsed=JSON.parse(r.content_json);}catch{}content[r.section_key]={title:r.title,subtitle:r.subtitle,data:parsed};});return sendJSON(res,{content});}
    if(method==='GET'&&pathname==='/api/services'){const services=db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();return sendJSON(res,{services:services.map(s=>({...s,deliverables:JSON.parse(s.deliverables||'[]'),team_roles:JSON.parse(s.team_roles||'[]')}))});}
    if(method==='GET'&&pathname.startsWith('/api/services/')&&pathname.length>14){const slug=pathname.replace('/api/services/','');const service=db.prepare('SELECT * FROM services WHERE slug=?').get(slug);if(!service)return sendError(res,'Service not found',404);service.deliverables=JSON.parse(service.deliverables||'[]');service.team_roles=JSON.parse(service.team_roles||'[]');return sendJSON(res,{service});}
    if(method==='GET'&&pathname==='/api/industries'){const industries=db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all();return sendJSON(res,{industries:industries.map(i=>({...i,off_their_plate:JSON.parse(i.off_their_plate||'[]')}))});}
    if(method==='GET'&&pathname==='/api/stories'){const stories=db.prepare('SELECT * FROM stories ORDER BY sort_order ASC').all();return sendJSON(res,{stories:stories.map(s=>({...s,metrics:JSON.parse(s.metrics||'[]')}))});}
    if(method==='GET'&&pathname==='/api/testimonials')return sendJSON(res,{testimonials:db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC').all()});
    if(method==='GET'&&pathname==='/api/team')return sendJSON(res,{team:db.prepare('SELECT * FROM team ORDER BY sort_order ASC').all()});
    if(method==='GET'&&pathname==='/api/insights')return sendJSON(res,{insights:db.prepare('SELECT * FROM insights ORDER BY published_at DESC').all()});
    if(method==='GET'&&pathname==='/api/settings/public'){
      const rows=db.prepare('SELECT key,value FROM settings').all();
      const settings={};
      rows.forEach(s=>settings[s.key]=s.value);
      delete settings.turnstile_secret_key;
      const hasSiteKey=Boolean(settings.turnstile_site_key&&settings.turnstile_site_key!=='1x00000000000000000000AA');
      const hasSecret=Boolean(process.env.TURNSTILE_SECRET_KEY);
      const actionConfigured=process.env.TURNSTILE_EXPECTED_ACTION==='contact';
      const hostnameConfigured=process.env.TURNSTILE_EXPECTED_HOSTNAME==='assistacorp.com';
      const cspConfigured=process.env.CSP_ALLOW_CLOUDFLARE==='true';
      const turnstileReady=hasSiteKey&&hasSecret&&actionConfigured&&hostnameConfigured&&cspConfigured;
      if(!turnstileReady)delete settings.turnstile_site_key;
      return sendJSON(res,{settings,turnstile_ready:turnstileReady});
    }
    if(method==='GET'&&pathname==='/api/seo'){const route=parsedUrl.query.route||'/';const seo=db.prepare('SELECT * FROM seo_metadata WHERE route=?').get(route)||{meta_title:'ASSISTA CORP | The People Behind Business.',meta_description:'Global Business Services platform giving businesses the dedicated people they need to move forward.',canonical_url:'https://assistacorp.com'};return sendJSON(res,{seo});}

    if(method==='POST'&&pathname==='/api/analytics/session'){if(!checkRateLimit(clientIp,30,60000))return sendError(res,'Analytics request limit reached.',429);const body=await parseBody(req);if(body.consentStatus!=='granted')return sendError(res,'Explicit analytics consent is required.',400);const session=recordSession({sessionId:body.sessionId,referrer:body.referrer,userAgent:req.headers['user-agent']||'',region:body.region||'Global',consentStatus:'granted'});if(!session)return sendError(res,'Invalid analytics session.',400);return sendJSON(res,{success:true,session});}
    if(method==='POST'&&pathname==='/api/analytics/track'){if(!checkRateLimit(clientIp,60,60000))return sendError(res,'Analytics request limit reached.',429);const body=await parseBody(req);if(!recordEvent({sessionId:body.sessionId,eventType:body.eventType,eventData:body.eventData||{}}))return sendError(res,'Analytics session is invalid or consent has not been granted.',403);return sendJSON(res,{success:true});}
    if(method==='POST'&&pathname==='/api/analytics/consent'){const body=await parseBody(req);if(body.consentStatus!=='rejected')return sendError(res,'Invalid consent update.',400);updateConsent(body.sessionId,'rejected');return sendJSON(res,{success:true});}

    if(method==='POST'&&pathname==='/api/leads/submit'){if(!checkRateLimit(clientIp,10,60000))return sendError(res,'Too many requests. Please wait a moment.',429);const body=await parseBody(req);const validation=validateLeadInput(body);if(!validation.ok)return sendError(res,validation.error,400);const lead=validation.value;if(!lead.turnstile_token)return sendError(res,'Security verification is required.',400);if(!(await verifyTurnstile(lead.turnstile_token,clientIp)))return sendError(res,'Security verification failed. Please try again.',403);const {name,business_email,company,industry,requirements,team_configuration,message,session_id}=lead;const consentedSession=session_id?db.prepare("SELECT session_id FROM visitor_sessions WHERE session_id=? AND consent_status='granted'").get(session_id):null;const attributedSessionId=consentedSession?session_id:null;const intentScore=calculateLeadScore(attributedSessionId,{business_email,company,industry,requirements,team_configuration});const scoreInfo=getLeadScoreTier(intentScore);const result=db.prepare(`INSERT INTO leads (name,business_email,company,industry,requirements,team_configuration,message,status,intent_score,session_id) VALUES (?,?,?,?,?,?,?,'New',?,?)`).run(name,business_email,company,industry,JSON.stringify(requirements),JSON.stringify(team_configuration),message,intentScore,attributedSessionId);const leadId=Number(result.lastInsertRowid);if(attributedSessionId){linkSessionToLead(attributedSessionId,leadId);recordEvent({sessionId:attributedSessionId,eventType:'form_submitted',eventData:{industry}});}const attribution=getLeadAttribution(attributedSessionId);const mailResult=await sendSalesNotification({lead:{id:leadId,name,business_email,company,industry,requirements,team_configuration,message,status:'New',intent_score:intentScore},scoreInfo,attribution});logAction({action:'LEAD_CAPTURED',entityType:'lead',entityId:leadId,details:{company,score:intentScore,tier:scoreInfo.tier,email_sent:Boolean(mailResult?.sent)},ipAddress:clientIp});return sendJSON(res,{success:true,leadId,intentScore,tier:scoreInfo.tier,message:'Your inquiry has been received. An Assista executive lead will connect with you promptly.'});}

    if(method==='POST'&&pathname==='/api/auth/login'){if(!checkRateLimit(clientIp,6,60000))return sendError(res,'Too many login attempts. Please wait 1 minute.',429);const body=await parseBody(req);const {email,password,totp_code}=body;if(!email||!password)return sendError(res,'Email and password required.');const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);if(!user)return sendError(res,'Invalid credentials.',401);const validPassword=verifyPassword(password,user.password_hash,user.salt);if(!validPassword){logAction({userEmail:email,action:'LOGIN_FAILED',entityType:'auth',details:'Incorrect password',ipAddress:clientIp});return sendError(res,'Invalid credentials.',401);}if(user.mfa_enabled){if(!totp_code)return sendJSON(res,{mfa_required:true,email:user.email});if(!verifyTOTP(user.mfa_secret,totp_code)){logAction({userId:user.id,userEmail:user.email,action:'MFA_FAILED',entityType:'auth',ipAddress:clientIp});return sendError(res,'Invalid verification code. Please check your authenticator.',401);}}const session=createSession(user.id,user.role);db.prepare('UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?').run(user.id);logAction({userId:user.id,userEmail:user.email,action:'LOGIN_SUCCESS',entityType:'auth',ipAddress:clientIp});res.setHeader('Set-Cookie',`assista_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);return sendJSON(res,{success:true,user:{id:user.id,email:user.email,name:user.name,role:user.role,mfa_enabled:Boolean(user.mfa_enabled)}});}
    if(method==='POST'&&pathname==='/api/auth/logout'){const user=authenticate(req);const cookies=parseCookies(req);if(cookies.assista_session)destroySession(cookies.assista_session);if(user)logAction({userId:user.user_id,userEmail:user.email,action:'LOGOUT',entityType:'auth',ipAddress:clientIp});res.setHeader('Set-Cookie','assista_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');return sendJSON(res,{success:true});}
    if(method==='GET'&&pathname==='/api/auth/me'){const user=authenticate(req);if(!user)return sendError(res,'Unauthorized',401);return sendJSON(res,{user:{id:user.user_id,email:user.email,name:user.name,role:user.role,mfa_enabled:Boolean(user.mfa_enabled)}});}
    if(method==='POST'&&pathname==='/api/auth/mfa/setup'){
      const user=authenticate(req);
      if(!user)return sendError(res,'Unauthorized',401);
      const secret=generateBase32Secret(20);
      const otpAuthUrl=`otpauth://totp/ASSISTA%20CORP:${encodeURIComponent(user.email)}?secret=${secret}&issuer=ASSISTA%20CORP`;
      // Keep the currently active MFA credential valid until the new secret is
      // proven with a current TOTP code. Abandoned setup must not lock users out.
      db.prepare('UPDATE users SET pending_mfa_secret=? WHERE id=?').run(secret,user.user_id);
      return sendJSON(res,{success:true,secret,otpAuthUrl,instructions:'Add this time-based key to your authenticator, then verify a current 6-digit code.'});
    }
    if(method==='POST'&&pathname==='/api/auth/mfa/verify'){
      const user=authenticate(req);
      if(!user)return sendError(res,'Unauthorized',401);
      const body=await parseBody(req);
      const userRecord=db.prepare('SELECT mfa_secret,pending_mfa_secret FROM users WHERE id=?').get(user.user_id);
      const candidate=userRecord?.pending_mfa_secret || userRecord?.mfa_secret;
      if(!candidate)return sendError(res,'Please initiate MFA setup first.');
      if(!verifyTOTP(candidate,body.code))return sendError(res,'Invalid 6-digit code. Please check your authenticator and try again.',401);
      db.prepare('UPDATE users SET mfa_secret=?,pending_mfa_secret=NULL,mfa_enabled=1 WHERE id=?').run(candidate,user.user_id);
      logAction({userId:user.user_id,userEmail:user.email,action:'MFA_ENABLED',entityType:'auth',details:'TOTP enrollment verified.',ipAddress:clientIp});
      return sendJSON(res,{success:true,message:'Two-factor authentication is now active on your account.'});
    }

    if(pathname.startsWith('/api/admin/')){
      const user=authenticate(req);if(!user)return sendError(res,'Unauthorized. Please sign in to Assista Operations.',401);
      if(!requirePermission(user,PERMISSIONS.VIEW_LEADS)&&!requirePermission(user,PERMISSIONS.VIEW_ANALYTICS)&&!requirePermission(user,PERMISSIONS.EDIT_CMS)&&!requirePermission(user,PERMISSIONS.VIEW_SETTINGS)&&!requirePermission(user,PERMISSIONS.VIEW_AUDIT))return sendError(res,'Access denied.',403);
      if(method==='GET'&&pathname==='/api/admin/leads'){if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_LEADS))return;const leads=db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();return sendJSON(res,{leads:leads.map(l=>{let reqs=[];let teamConfig={};let notes=[];try{reqs=JSON.parse(l.requirements||'[]');}catch{}try{teamConfig=JSON.parse(l.team_configuration||'{}');}catch{}try{notes=JSON.parse(l.notes||'[]');}catch{}return {...l,requirements:reqs,team_configuration:teamConfig,notes,tier:getLeadScoreTier(l.intent_score)};})});}
      if(method==='GET'&&pathname.startsWith('/api/admin/leads/')&&!pathname.endsWith('/status')&&!pathname.endsWith('/notes')){if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_LEADS))return;const id=pathname.replace('/api/admin/leads/','');const lead=db.prepare('SELECT * FROM leads WHERE id=?').get(id);if(!lead)return sendError(res,'Lead not found',404);lead.requirements=JSON.parse(lead.requirements||'[]');lead.team_configuration=JSON.parse(lead.team_configuration||'{}');lead.notes=JSON.parse(lead.notes||'[]');lead.tier=getLeadScoreTier(lead.intent_score);return sendJSON(res,{lead,attribution:getLeadAttribution(lead.session_id)});}
      if(method==='PATCH'&&pathname.includes('/status')){if(!requirePermissionOr403(res,user,PERMISSIONS.UPDATE_LEADS))return;const parts=pathname.split('/');const id=parts[4];const body=await parseBody(req);const allowed=['New','Contacted','Qualified','Proposal','Won','Lost'];if(!allowed.includes(body.status))return sendError(res,'Invalid status.');const updateResult=db.prepare('UPDATE leads SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(body.status,id);if(!updateResult.changes)return sendError(res,'Lead not found',404);logAction({userId:user.user_id,userEmail:user.email,action:'LEAD_STATUS_UPDATE',entityType:'lead',entityId:id,details:{new_status:body.status},ipAddress:clientIp});return sendJSON(res,{success:true,status:body.status});}
      if(method==='POST'&&pathname.includes('/notes')){if(!requirePermissionOr403(res,user,PERMISSIONS.ADD_LEAD_NOTES))return;const parts=pathname.split('/');const id=parts[4];const body=await parseBody(req);const noteValidation=validateAdminNote(body);if(!noteValidation.ok)return sendError(res,noteValidation.error);const lead=db.prepare('SELECT notes FROM leads WHERE id=?').get(id);if(!lead)return sendError(res,'Lead not found',404);let notes=[];try{notes=JSON.parse(lead.notes||'[]');}catch{}notes.push({date:new Date().toISOString(),author:user.name,note:noteValidation.value.note});db.prepare('UPDATE leads SET notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(JSON.stringify(notes),id);logAction({userId:user.user_id,userEmail:user.email,action:'LEAD_NOTE_ADDED',entityType:'lead',entityId:id,details:{noteLength:noteValidation.value.note.length},ipAddress:clientIp});return sendJSON(res,{success:true,notes});}
      if(method==='GET'&&pathname==='/api/admin/analytics/overview'){if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_ANALYTICS))return;return sendJSON(res,{overview:getAnalyticsOverview()});}
      if(method==='GET'&&pathname==='/api/admin/analytics/live'){if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_ANALYTICS))return;return sendJSON(res,{liveSessions:getLiveSessions(30)});}
      if(method==='GET'&&pathname==='/api/admin/audit'){if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_AUDIT))return;return sendJSON(res,{logs:getAuditLogs(100)});}
      if(method==='GET'&&pathname==='/api/admin/cms'){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_CMS))return;const rows=db.prepare('SELECT id,section_key,title,subtitle,content_json,updated_at FROM cms_content').all();return sendJSON(res,{sections:rows.map(r=>({id:r.id,section_key:r.section_key,title:r.title,subtitle:r.subtitle,data:JSON.parse(r.content_json||'{}'),updated_at:r.updated_at}))});}
      if(method==='PUT'&&pathname.startsWith('/api/admin/cms/')){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_CMS))return;const sectionKey=pathname.replace('/api/admin/cms/','');if(!['hero','behind_business'].includes(sectionKey))return sendError(res,'Unknown CMS section.',404);const body=await parseBody(req);const title=boundedText(body.title,180,true);const subtitle=boundedText(body.subtitle,600,true);if(title===null||subtitle===null||!body.data||typeof body.data!=='object'||Array.isArray(body.data))return sendError(res,'Invalid CMS content. Check title, subtitle, and JSON data.',400);const serialized=JSON.stringify(body.data);if(Buffer.byteLength(serialized,'utf8')>30000)return sendError(res,'CMS content exceeds the 30 KB limit.',400);const result=db.prepare('UPDATE cms_content SET title=?,subtitle=?,content_json=?,updated_at=CURRENT_TIMESTAMP WHERE section_key=?').run(title,subtitle,serialized,sectionKey);if(!result.changes)return sendError(res,'CMS section not found.',404);logAction({userId:user.user_id,userEmail:user.email,action:'CMS_UPDATE',entityType:'cms_content',entityId:sectionKey,details:{title},ipAddress:clientIp});return sendJSON(res,{success:true,message:'CMS section updated successfully.'});}
      if(method==='GET'&&pathname==='/api/admin/services'){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_SERVICES))return;return sendJSON(res,{services:db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all()});}
      if(method==='PUT'&&pathname.startsWith('/api/admin/services/')){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_SERVICES))return;const id=pathname.replace('/api/admin/services/','');if(!/^\\d+$/.test(id))return sendError(res,'Invalid service identifier.',400);const body=await parseBody(req);const name=boundedText(body.name,120,true);const tagline=boundedText(body.tagline,240,true);const description=boundedText(body.description,4000,true);const typicalSla=boundedText(body.typical_sla,200,true);const deliverables=boundedStringArray(body.deliverables,25,240);const teamRoles=boundedStringArray(body.team_roles,25,120);if(name===null||tagline===null||description===null||typicalSla===null||deliverables===null||teamRoles===null)return sendError(res,'Invalid service fields or limits exceeded.',400);const result=db.prepare('UPDATE services SET name=?,tagline=?,description=?,deliverables=?,team_roles=?,typical_sla=? WHERE id=?').run(name,tagline,description,JSON.stringify(deliverables),JSON.stringify(teamRoles),typicalSla,id);if(!result.changes)return sendError(res,'Service not found.',404);logAction({userId:user.user_id,userEmail:user.email,action:'SERVICE_UPDATE',entityType:'services',entityId:id,details:{name},ipAddress:clientIp});return sendJSON(res,{success:true});}
      if(method==='GET'&&pathname==='/api/admin/industries'){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_INDUSTRIES))return;return sendJSON(res,{industries:db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all()});}
      if(method==='PUT'&&pathname.startsWith('/api/admin/industries/')){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_INDUSTRIES))return;const id=pathname.replace('/api/admin/industries/','');if(!/^\\d+$/.test(id))return sendError(res,'Invalid industry identifier.',400);const body=await parseBody(req);const headline=boundedText(body.headline,240,true);const subheadline=boundedText(body.subheadline,600,true);const caseSnapshot=boundedText(body.case_snapshot,3000,true);const workflows=boundedStringArray(body.off_their_plate,30,300);if(headline===null||subheadline===null||caseSnapshot===null||workflows===null)return sendError(res,'Invalid industry fields or limits exceeded.',400);const result=db.prepare('UPDATE industries SET headline=?,subheadline=?,off_their_plate=?,case_snapshot=? WHERE id=?').run(headline,subheadline,JSON.stringify(workflows),caseSnapshot,id);if(!result.changes)return sendError(res,'Industry not found.',404);logAction({userId:user.user_id,userEmail:user.email,action:'INDUSTRY_UPDATE',entityType:'industries',entityId:id,details:{id},ipAddress:clientIp});return sendJSON(res,{success:true});}
      if(method==='GET'&&pathname==='/api/admin/seo'){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_SEO))return;return sendJSON(res,{seoList:db.prepare('SELECT * FROM seo_metadata').all()});}
      if(method==='PUT'&&pathname.startsWith('/api/admin/seo/')){if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_SEO))return;const id=pathname.replace('/api/admin/seo/','');if(!/^\\d+$/.test(id))return sendError(res,'Invalid SEO record identifier.',400);const body=await parseBody(req);const title=boundedText(body.meta_title,100,true);const description=boundedText(body.meta_description,320,true);const ogImage=safeHttpsUrl(body.og_image,500);const canonical=safeHttpsUrl(body.canonical_url,500);const keywords=boundedText(body.keywords,400);if(title===null||description===null||ogImage===null||canonical===null||keywords===null)return sendError(res,'Invalid SEO metadata. URLs must use HTTPS and text must be within the field limits.',400);const result=db.prepare('UPDATE seo_metadata SET meta_title=?,meta_description=?,og_image=?,canonical_url=?,keywords=? WHERE id=?').run(title,description,ogImage,canonical,keywords,id);if(!result.changes)return sendError(res,'SEO record not found.',404);logAction({userId:user.user_id,userEmail:user.email,action:'SEO_UPDATE',entityType:'seo_metadata',entityId:id,ipAddress:clientIp});return sendJSON(res,{success:true});}
      if(method==='GET'&&pathname==='/api/admin/settings'){
        if(!requirePermissionOr403(res,user,PERMISSIONS.VIEW_SETTINGS))return;
        const settings=db.prepare('SELECT key,value FROM settings').all();
        const map={};
        settings.forEach(s=>{if(!/(secret|token|password|private|credential)/i.test(s.key))map[s.key]=s.value;});
        const siteKeyConfigured=Boolean(map.turnstile_site_key&&map.turnstile_site_key!=='1x00000000000000000000AA');
        const secretConfigured=Boolean(process.env.TURNSTILE_SECRET_KEY);
        const actionConfigured=process.env.TURNSTILE_EXPECTED_ACTION==='contact';
        const hostnameConfigured=process.env.TURNSTILE_EXPECTED_HOSTNAME==='assistacorp.com';
        const cspConfigured=process.env.CSP_ALLOW_CLOUDFLARE==='true';
        return sendJSON(res,{settings:map,security:{
          turnstile_site_key_configured:siteKeyConfigured,
          turnstile_secret_configured:secretConfigured,
          turnstile_action_configured:actionConfigured,
          turnstile_hostname_configured:hostnameConfigured,
          cloudflare_csp_enabled:cspConfigured,
          turnstile_ready:siteKeyConfigured&&secretConfigured&&actionConfigured&&hostnameConfigured&&cspConfigured
        }});
      }
      if(method==='PUT'&&pathname==='/api/admin/settings'){
        if(!requirePermissionOr403(res,user,PERMISSIONS.EDIT_SETTINGS))return;
        const body=await parseBody(req);
        const allowed={sales_email:320,phone:80,headquarters:240,turnstile_site_key:200};
        const updates=[];
        for(const [key,max] of Object.entries(allowed)){
          if(body[key]===undefined)continue;
          if(typeof body[key]!=='string'||body[key].trim().length>max)return sendError(res,`Invalid setting: ${key}.`,400);
          const value=body[key].trim();
          if(key==='sales_email'&&value&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value))return sendError(res,'Invalid sales email address.',400);
          if(key==='turnstile_site_key'&&value&&(!/^[A-Za-z0-9_-]{10,200}$/.test(value)||value==='1x00000000000000000000AA'))return sendError(res,'Enter a live Cloudflare Turnstile site key, not a test key.',400);
          updates.push([key,value]);
        }
        if(Object.keys(body).some(key=>!Object.hasOwn(allowed,key)))return sendError(res,'Unsupported settings field.',400);
        for(const [key,value] of updates)db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)').run(key,value);
        logAction({userId:user.user_id,userEmail:user.email,action:'SETTINGS_UPDATE',entityType:'settings',details:{updated_fields:updates.map(([key])=>key)},ipAddress:clientIp});
        return sendJSON(res,{success:true,updated:updates.map(([key])=>key)});
      }
      return sendError(res,'Admin endpoint not found',404);
    }
    if(method==='GET'&&!pathname.startsWith('/api/')){const notFoundPage=path.join(PUBLIC_DIR,'404.html');if(fs.existsSync(notFoundPage))return sendFile(res,notFoundPage,'text/html; charset=utf-8',404);return sendError(res,'Page not found',404);}
    return sendError(res,'Not found',404);
  } catch(err){console.error('Server error on',method,pathname,err);return sendError(res,'Internal server error',500);}
});

if(require.main===module)server.listen(PORT,()=>{console.log(`[ASSISTA CORP] Production server listening on http://localhost:${PORT}`);console.log(`[ASSISTA CORP] Public portal: http://localhost:${PORT}/`);console.log(`[ASSISTA CORP] Admin portal: http://localhost:${PORT}/admin`);});
module.exports={server};