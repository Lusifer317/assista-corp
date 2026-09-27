const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const { installHttpSecurity } = require('./lib/http-security');
installHttpSecurity();

const { db } = require('./lib/db');
const {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  checkRateLimit,
  generateBase32Secret,
  verifyTOTP,
  parseCookies
} = require('./lib/auth');
const {
  recordSession,
  recordEvent,
  updateConsent,
  getLiveSessions,
  getAnalyticsOverview
} = require('./lib/analytics');
const {
  calculateLeadScore,
  getLeadScoreTier,
  linkSessionToLead,
  getLeadAttribution
} = require('./lib/scoring');
const { sendSalesNotification } = require('./lib/mailer');
const { logAction, getAuditLogs } = require('./lib/audit');
const { verifyTurnstile } = require('./lib/turnstile');
const { validateLeadInput, validateAdminNote } = require('./lib/validation');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');

const PUBLIC_ROUTES = {
  '/': path.join(PUBLIC_DIR, 'index.html'),
  '/services': path.join(PUBLIC_DIR, 'services', 'index.html'),
  '/services/executive-support': path.join(PUBLIC_DIR, 'services', 'executive-support.html'),
  '/services/finance-reconciliation': path.join(PUBLIC_DIR, 'services', 'finance-reconciliation.html'),
  '/services/customer-care': path.join(PUBLIC_DIR, 'services', 'customer-care.html'),
  '/services/recruitment-talent': path.join(PUBLIC_DIR, 'services', 'recruitment-talent.html'),
  '/industries': path.join(PUBLIC_DIR, 'industries.html'),
  '/how-we-work': path.join(PUBLIC_DIR, 'how-we-work.html'),
  '/about': path.join(PUBLIC_DIR, 'about.html'),
  '/contact': path.join(PUBLIC_DIR, 'contact.html')
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, message, statusCode = 400) { sendJSON(res, { error: message }, statusCode); }

function sendFile(res, filePath, contentType, statusCode = 200) {
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404 Not Found'); return; }
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
  });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (process.env.TRUST_PROXY === 'cloudflare' && forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function authenticate(req) {
  const cookies = parseCookies(req);
  const token = cookies.assista_session || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  return validateSession(token);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const clientIp = getClientIp(req);

  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  try {
    const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    if (method === 'GET' && PUBLIC_ROUTES[cleanPath]) return sendFile(res, PUBLIC_ROUTES[cleanPath], 'text/html; charset=utf-8');

    if (method === 'GET' && cleanPath === '/admin') {
      const user = authenticate(req);
      if (!user) { res.writeHead(302, { Location: '/login' }); res.end(); return; }
      return sendFile(res, path.join(VIEWS_DIR, 'admin.html'), 'text/html; charset=utf-8');
    }

    if (method === 'GET' && cleanPath === '/login') {
      const user = authenticate(req);
      if (user) { res.writeHead(302, { Location: '/admin' }); res.end(); return; }
      return sendFile(res, path.join(VIEWS_DIR, 'login.html'), 'text/html; charset=utf-8');
    }

    if (method === 'GET' && !pathname.startsWith('/api/')) {
      const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(PUBLIC_DIR, safePath);
      const ext = path.extname(filePath).toLowerCase();
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return sendFile(res, filePath, MIME_TYPES[ext] || 'application/octet-stream');
    }

    if (method === 'GET' && pathname === '/api/content') {
      const rows = db.prepare('SELECT section_key, title, subtitle, content_json FROM cms_content').all();
      const content = {};
      rows.forEach(r => { let parsed = {}; try { parsed = JSON.parse(r.content_json); } catch {} content[r.section_key] = { title: r.title, subtitle: r.subtitle, data: parsed }; });
      return sendJSON(res, { content });
    }

    if (method === 'GET' && pathname === '/api/services') {
      const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
      const formatted = services.map(s => ({ ...s, deliverables: JSON.parse(s.deliverables || '[]'), team_roles: JSON.parse(s.team_roles || '[]') }));
      return sendJSON(res, { services: formatted });
    }

    if (method === 'GET' && pathname.startsWith('/api/services/') && pathname.length > 14) {
      const slug = pathname.replace('/api/services/', '');
      const service = db.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
      if (!service) return sendError(res, 'Service not found', 404);
      service.deliverables = JSON.parse(service.deliverables || '[]'); service.team_roles = JSON.parse(service.team_roles || '[]');
      return sendJSON(res, { service });
    }

    if (method === 'GET' && pathname === '/api/industries') {
      const industries = db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all();
      return sendJSON(res, { industries: industries.map(i => ({ ...i, off_their_plate: JSON.parse(i.off_their_plate || '[]') })) });
    }
    if (method === 'GET' && pathname === '/api/stories') {
      const stories = db.prepare('SELECT * FROM stories ORDER BY sort_order ASC').all();
      return sendJSON(res, { stories: stories.map(s => ({ ...s, metrics: JSON.parse(s.metrics || '[]') })) });
    }
    if (method === 'GET' && pathname === '/api/testimonials') return sendJSON(res, { testimonials: db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC').all() });
    if (method === 'GET' && pathname === '/api/team') return sendJSON(res, { team: db.prepare('SELECT * FROM team ORDER BY sort_order ASC').all() });
    if (method === 'GET' && pathname === '/api/insights') return sendJSON(res, { insights: db.prepare('SELECT * FROM insights ORDER BY published_at DESC').all() });

    if (method === 'GET' && pathname === '/api/settings/public') {
      const settingsRows = db.prepare('SELECT key, value FROM settings').all(); const settings = {};
      settingsRows.forEach(s => settings[s.key] = s.value); delete settings.turnstile_secret_key;
      return sendJSON(res, { settings });
    }

    if (method === 'GET' && pathname === '/api/seo') {
      const route = parsedUrl.query.route || '/';
      const seo = db.prepare('SELECT * FROM seo_metadata WHERE route = ?').get(route) || { meta_title: 'ASSISTA CORP | The People Behind Business.', meta_description: 'Global Business Services platform giving businesses the dedicated people they need to move forward.', canonical_url: 'https://assistacorp.com' };
      return sendJSON(res, { seo });
    }

    if (method === 'POST' && pathname === '/api/analytics/session') {
      const body = await parseBody(req); const userAgent = req.headers['user-agent'] || '';
      const session = recordSession({ sessionId: body.sessionId, referrer: body.referrer, userAgent, region: body.region || 'Global', consentStatus: body.consentStatus || 'pending' });
      return sendJSON(res, { success: true, session });
    }
    if (method === 'POST' && pathname === '/api/analytics/track') {
      const body = await parseBody(req); recordEvent({ sessionId: body.sessionId, eventType: body.eventType, eventData: body.eventData || {} });
      return sendJSON(res, { success: true });
    }
    if (method === 'POST' && pathname === '/api/analytics/consent') {
      const body = await parseBody(req); updateConsent(body.sessionId, body.consentStatus); return sendJSON(res, { success: true });
    }

    if (method === 'POST' && pathname === '/api/leads/submit') {
      if (!checkRateLimit(clientIp, 10, 60000)) return sendError(res, 'Too many requests. Please wait a moment.', 429);
      const body = await parseBody(req);
      const validation = validateLeadInput(body);
      if (!validation.ok) return sendError(res, validation.error, 400);
      const lead = validation.value;
      if (!lead.turnstile_token) return sendError(res, 'Security verification is required.', 400);
      const turnstileValid = await verifyTurnstile(lead.turnstile_token, clientIp);
      if (!turnstileValid) return sendError(res, 'Security verification failed. Please try again.', 403);

      const { name, business_email, company, industry, requirements, team_configuration, message, session_id } = lead;
      const intentScore = calculateLeadScore(session_id, { business_email, company, industry, requirements, team_configuration });
      const scoreInfo = getLeadScoreTier(intentScore);
      const requirementsJson = JSON.stringify(requirements);
      const teamConfigJson = JSON.stringify(team_configuration);
      const result = db.prepare(`INSERT INTO leads (name, business_email, company, industry, requirements, team_configuration, message, status, intent_score, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?)`).run(name, business_email, company, industry, requirementsJson, teamConfigJson, message, intentScore, session_id || null);
      const leadId = Number(result.lastInsertRowid);
      if (session_id) { linkSessionToLead(session_id, leadId); recordEvent({ sessionId: session_id, eventType: 'form_submitted', eventData: { company, industry, leadId } }); }
      const attribution = getLeadAttribution(session_id);
      const mailResult = await sendSalesNotification({ lead: { id: leadId, name, business_email, company, industry, requirements, team_configuration, message, status: 'New', intent_score: intentScore }, scoreInfo, attribution });
      logAction({ action: 'LEAD_CAPTURED', entityType: 'lead', entityId: leadId, details: { company, score: intentScore, tier: scoreInfo.tier, email_sent: Boolean(mailResult?.sent) }, ipAddress: clientIp });
      return sendJSON(res, { success: true, leadId, intentScore, tier: scoreInfo.tier, message: 'Your inquiry has been received. An Assista executive lead will connect with you promptly.' });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      if (!checkRateLimit(clientIp, 6, 60000)) return sendError(res, 'Too many login attempts. Please wait 1 minute.', 429);
      const body = await parseBody(req); const { email, password, totp_code } = body;
      if (!email || !password) return sendError(res, 'Email and password required.');
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return sendError(res, 'Invalid credentials.', 401);
      const validPassword = verifyPassword(password, user.password_hash, user.salt);
      if (!validPassword) { logAction({ userEmail: email, action: 'LOGIN_FAILED', entityType: 'auth', details: 'Incorrect password', ipAddress: clientIp }); return sendError(res, 'Invalid credentials.', 401); }
      if (user.mfa_enabled) {
        if (!totp_code) return sendJSON(res, { mfa_required: true, email: user.email });
        if (!verifyTOTP(user.mfa_secret, totp_code)) { logAction({ userId: user.id, userEmail: user.email, action: 'MFA_FAILED', entityType: 'auth', ipAddress: clientIp }); return sendError(res, 'Invalid verification code. Please check your authenticator.', 401); }
      }
      const session = createSession(user.id, user.role);
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      logAction({ userId: user.id, userEmail: user.email, action: 'LOGIN_SUCCESS', entityType: 'auth', ipAddress: clientIp });
      res.setHeader('Set-Cookie', `assista_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
      return sendJSON(res, { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, mfa_enabled: Boolean(user.mfa_enabled) } });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const user = authenticate(req); const cookies = parseCookies(req); if (cookies.assista_session) destroySession(cookies.assista_session);
      if (user) logAction({ userId: user.user_id, userEmail: user.email, action: 'LOGOUT', entityType: 'auth', ipAddress: clientIp });
      res.setHeader('Set-Cookie', 'assista_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); return sendJSON(res, { success: true });
    }
    if (method === 'GET' && pathname === '/api/auth/me') {
      const user = authenticate(req); if (!user) return sendError(res, 'Unauthorized', 401);
      return sendJSON(res, { user: { id: user.user_id, email: user.email, name: user.name, role: user.role, mfa_enabled: Boolean(user.mfa_enabled) } });
    }
    if (method === 'POST' && pathname === '/api/auth/mfa/setup') {
      const user = authenticate(req); if (!user) return sendError(res, 'Unauthorized', 401);
      const secret = generateBase32Secret(20); const otpAuthUrl = `otpauth://totp/ASSISTA%20CORP:${encodeURIComponent(user.email)}?secret=${secret}&issuer=ASSISTA%20CORP`;
      db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(secret, user.user_id);
      return sendJSON(res, { success: true, secret, otpAuthUrl, instructions: 'Enter this secret or scan QR code in Google Authenticator / 1Password, then enter the 6-digit code to verify.' });
    }
    if (method === 'POST' && pathname === '/api/auth/mfa/verify') {
      const user = authenticate(req); if (!user) return sendError(res, 'Unauthorized', 401);
      const body = await parseBody(req); const userRecord = db.prepare('SELECT mfa_secret FROM users WHERE id = ?').get(user.user_id);
      if (!userRecord || !userRecord.mfa_secret) return sendError(res, 'Please initiate MFA setup first.');
      if (!verifyTOTP(userRecord.mfa_secret, body.code)) return sendError(res, 'Invalid 6-digit code. Please try again.');
      db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.user_id);
      logAction({ userId: user.user_id, userEmail: user.email, action: 'MFA_ENABLED', entityType: 'auth', ipAddress: clientIp });
      return sendJSON(res, { success: true, message: 'Two-factor authentication is now active on your account.' });
    }

    if (pathname.startsWith('/api/admin/')) {
      const user = authenticate(req);
      if (!user) return sendError(res, 'Unauthorized. Please sign in to Assista Operations.', 401);
      if (!['admin', 'editor', 'sales'].includes(user.role)) return sendError(res, 'Access denied.', 403);

      if (method === 'GET' && pathname === '/api/admin/leads') {
        const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
        const formatted = leads.map(l => { let reqs = []; try { reqs = JSON.parse(l.requirements || '[]'); } catch {} let teamConfig = {}; try { teamConfig = JSON.parse(l.team_configuration || '{}'); } catch {} let notes = []; try { notes = JSON.parse(l.notes || '[]'); } catch {} return { ...l, requirements: reqs, team_configuration: teamConfig, notes, tier: getLeadScoreTier(l.intent_score) }; });
        return sendJSON(res, { leads: formatted });
      }
      if (method === 'GET' && pathname.startsWith('/api/admin/leads/') && !pathname.endsWith('/status') && !pathname.endsWith('/notes')) {
        const id = pathname.replace('/api/admin/leads/', ''); const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
        if (!lead) return sendError(res, 'Lead not found', 404);
        lead.requirements = JSON.parse(lead.requirements || '[]'); lead.team_configuration = JSON.parse(lead.team_configuration || '{}'); lead.notes = JSON.parse(lead.notes || '[]'); lead.tier = getLeadScoreTier(lead.intent_score);
        return sendJSON(res, { lead, attribution: getLeadAttribution(lead.session_id) });
      }
      if (method === 'PATCH' && pathname.includes('/status')) {
        const parts = pathname.split('/'); const id = parts[4]; const body = await parseBody(req); const { status } = body;
        const allowed = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']; if (!allowed.includes(status)) return sendError(res, 'Invalid status.');
        db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'LEAD_STATUS_UPDATE', entityType: 'lead', entityId: id, details: { new_status: status }, ipAddress: clientIp });
        return sendJSON(res, { success: true, status });
      }
      if (method === 'POST' && pathname.includes('/notes')) {
        const parts = pathname.split('/'); const id = parts[4]; const body = await parseBody(req); const noteValidation = validateAdminNote(body);
        if (!noteValidation.ok) return sendError(res, noteValidation.error); const note = noteValidation.value;
        const lead = db.prepare('SELECT notes FROM leads WHERE id = ?').get(id); if (!lead) return sendError(res, 'Lead not found', 404);
        let notes = []; try { notes = JSON.parse(lead.notes || '[]'); } catch {}
        notes.push({ date: new Date().toISOString(), author: user.name, note });
        db.prepare('UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(notes), id);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'LEAD_NOTE_ADDED', entityType: 'lead', entityId: id, details: { noteLength: note.length }, ipAddress: clientIp });
        return sendJSON(res, { success: true, notes });
      }
      if (method === 'GET' && pathname === '/api/admin/analytics/overview') return sendJSON(res, { overview: getAnalyticsOverview() });
      if (method === 'GET' && pathname === '/api/admin/analytics/live') return sendJSON(res, { liveSessions: getLiveSessions(30) });
      if (method === 'GET' && pathname === '/api/admin/audit') return sendJSON(res, { logs: getAuditLogs(100) });
      if (method === 'GET' && pathname === '/api/admin/cms') {
        const rows = db.prepare('SELECT id, section_key, title, subtitle, content_json, updated_at FROM cms_content').all();
        return sendJSON(res, { sections: rows.map(r => ({ id: r.id, section_key: r.section_key, title: r.title, subtitle: r.subtitle, data: JSON.parse(r.content_json || '{}'), updated_at: r.updated_at })) });
      }
      if (method === 'PUT' && pathname.startsWith('/api/admin/cms/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied. Editor or Administrator role required.', 403);
        const sectionKey = pathname.replace('/api/admin/cms/', ''); const body = await parseBody(req); const { title, subtitle, data } = body;
        db.prepare('UPDATE cms_content SET title = ?, subtitle = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = ?').run(title, subtitle, JSON.stringify(data), sectionKey);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'CMS_UPDATE', entityType: 'cms_content', entityId: sectionKey, details: { title }, ipAddress: clientIp });
        return sendJSON(res, { success: true, message: `Section '${sectionKey}' updated successfully.` });
      }
      if (method === 'GET' && pathname === '/api/admin/services') return sendJSON(res, { services: db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all() });
      if (method === 'PUT' && pathname.startsWith('/api/admin/services/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403); const id = pathname.replace('/api/admin/services/', ''); const body = await parseBody(req);
        db.prepare('UPDATE services SET name = ?, tagline = ?, description = ?, deliverables = ?, team_roles = ?, typical_sla = ? WHERE id = ?').run(body.name, body.tagline, body.description, JSON.stringify(body.deliverables || []), JSON.stringify(body.team_roles || []), body.typical_sla, id);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'SERVICE_UPDATE', entityType: 'services', entityId: id, details: { name: body.name }, ipAddress: clientIp }); return sendJSON(res, { success: true });
      }
      if (method === 'GET' && pathname === '/api/admin/industries') return sendJSON(res, { industries: db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all() });
      if (method === 'PUT' && pathname.startsWith('/api/admin/industries/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403); const id = pathname.replace('/api/admin/industries/', ''); const body = await parseBody(req);
        db.prepare('UPDATE industries SET headline = ?, subheadline = ?, off_their_plate = ?, case_snapshot = ? WHERE id = ?').run(body.headline, body.subheadline, JSON.stringify(body.off_their_plate || []), body.case_snapshot, id);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'INDUSTRY_UPDATE', entityType: 'industries', entityId: id, details: { id }, ipAddress: clientIp }); return sendJSON(res, { success: true });
      }
      if (method === 'GET' && pathname === '/api/admin/seo') return sendJSON(res, { seoList: db.prepare('SELECT * FROM seo_metadata').all() });
      if (method === 'PUT' && pathname.startsWith('/api/admin/seo/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403); const id = pathname.replace('/api/admin/seo/', ''); const body = await parseBody(req);
        db.prepare('UPDATE seo_metadata SET meta_title = ?, meta_description = ?, og_image = ?, canonical_url = ?, keywords = ? WHERE id = ?').run(body.meta_title, body.meta_description, body.og_image, body.canonical_url, body.keywords, id);
        logAction({ userId: user.user_id, userEmail: user.email, action: 'SEO_UPDATE', entityType: 'seo_metadata', entityId: id, ipAddress: clientIp }); return sendJSON(res, { success: true });
      }
      if (method === 'GET' && pathname === '/api/admin/settings') {
        if (user.role !== 'admin') return sendError(res, 'Administrator access required.', 403); const settings = db.prepare('SELECT key, value FROM settings').all(); const map = {}; settings.forEach(s => map[s.key] = s.value); return sendJSON(res, { settings: map });
      }
      if (method === 'PUT' && pathname === '/api/admin/settings') {
        if (user.role !== 'admin') return sendError(res, 'Administrator access required.', 403); const body = await parseBody(req);
        for (const [key, val] of Object.entries(body)) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(val));
        logAction({ userId: user.user_id, userEmail: user.email, action: 'SETTINGS_UPDATE', entityType: 'settings', ipAddress: clientIp }); return sendJSON(res, { success: true });
      }
      return sendError(res, 'Admin endpoint not found', 404);
    }

    if (method === 'GET' && !pathname.startsWith('/api/')) {
      const notFoundPage = path.join(PUBLIC_DIR, '404.html'); if (fs.existsSync(notFoundPage)) return sendFile(res, notFoundPage, 'text/html; charset=utf-8', 404); return sendError(res, 'Page not found', 404);
    }
    return sendError(res, 'Not found', 404);
  } catch (err) {
    console.error('Server error on', method, pathname, err); return sendError(res, 'Internal server error', 500);
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[ASSISTA CORP] Production server listening on http://localhost:${PORT}`);
    console.log(`[ASSISTA CORP] Public portal: http://localhost:${PORT}/`);
    console.log(`[ASSISTA CORP] Admin portal: http://localhost:${PORT}/admin`);
  });
}

module.exports = { server };
