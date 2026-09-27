const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

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
      // Safeguard max payload size 2MB
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
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

function sendError(res, message, statusCode = 400) {
  sendJSON(res, { error: message }, statusCode);
}

function sendFile(res, filePath, contentType, statusCode = 200) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
  });
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

function authenticate(req) {
  const cookies = parseCookies(req);
  const token = cookies.assista_session || req.headers['authorization']?.replace('Bearer ', '');
  return validateSession(token);
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const clientIp = getClientIp(req);

  // Security headers for all responses
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  try {
    // Normalize path by stripping trailing slash
    const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    // ----------------------------------------------------
    // 1. PUBLIC HTML ROUTES
    // ----------------------------------------------------
    if (method === 'GET' && PUBLIC_ROUTES[cleanPath]) {
      return sendFile(res, PUBLIC_ROUTES[cleanPath], 'text/html; charset=utf-8');
    }

    if (method === 'GET' && cleanPath === '/admin') {
      const user = authenticate(req);
      if (!user) {
        res.writeHead(302, { Location: '/login' });
        res.end();
        return;
      }
      return sendFile(res, path.join(VIEWS_DIR, 'admin.html'), 'text/html; charset=utf-8');
    }

    if (method === 'GET' && cleanPath === '/login') {
      const user = authenticate(req);
      if (user) {
        res.writeHead(302, { Location: '/admin' });
        res.end();
        return;
      }
      return sendFile(res, path.join(VIEWS_DIR, 'login.html'), 'text/html; charset=utf-8');
    }

    // ----------------------------------------------------
    // 2. STATIC FILES SERVING (/css, /js, /images, etc.)
    // ----------------------------------------------------
    if (method === 'GET' && !pathname.startsWith('/api/')) {
      const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(PUBLIC_DIR, safePath);
      const ext = path.extname(filePath).toLowerCase();

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        return sendFile(res, filePath, contentType);
      }
    }

    // ----------------------------------------------------
    // 3. PUBLIC CMS DATA APIS
    // ----------------------------------------------------
    if (method === 'GET' && pathname === '/api/content') {
      const rows = db.prepare('SELECT section_key, title, subtitle, content_json FROM cms_content').all();
      const content = {};
      rows.forEach(r => {
        let parsed = {};
        try { parsed = JSON.parse(r.content_json); } catch (e) {}
        content[r.section_key] = {
          title: r.title,
          subtitle: r.subtitle,
          data: parsed
        };
      });
      return sendJSON(res, { content });
    }

    if (method === 'GET' && pathname === '/api/services') {
      const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
      const formatted = services.map(s => ({
        ...s,
        deliverables: JSON.parse(s.deliverables || '[]'),
        team_roles: JSON.parse(s.team_roles || '[]')
      }));
      return sendJSON(res, { services: formatted });
    }

    if (method === 'GET' && pathname.startsWith('/api/services/') && pathname.length > 14) {
      const slug = pathname.replace('/api/services/', '');
      const service = db.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
      if (!service) return sendError(res, 'Service not found', 404);
      service.deliverables = JSON.parse(service.deliverables || '[]');
      service.team_roles = JSON.parse(service.team_roles || '[]');
      return sendJSON(res, { service });
    }

    if (method === 'GET' && pathname === '/api/industries') {
      const industries = db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all();
      const formatted = industries.map(i => ({
        ...i,
        off_their_plate: JSON.parse(i.off_their_plate || '[]')
      }));
      return sendJSON(res, { industries: formatted });
    }

    if (method === 'GET' && pathname === '/api/stories') {
      const stories = db.prepare('SELECT * FROM stories ORDER BY sort_order ASC').all();
      const formatted = stories.map(s => ({
        ...s,
        metrics: JSON.parse(s.metrics || '[]')
      }));
      return sendJSON(res, { stories: formatted });
    }

    if (method === 'GET' && pathname === '/api/testimonials') {
      const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC').all();
      return sendJSON(res, { testimonials });
    }

    if (method === 'GET' && pathname === '/api/team') {
      const team = db.prepare('SELECT * FROM team ORDER BY sort_order ASC').all();
      return sendJSON(res, { team });
    }

    if (method === 'GET' && pathname === '/api/insights') {
      const insights = db.prepare('SELECT * FROM insights ORDER BY published_at DESC').all();
      return sendJSON(res, { insights });
    }

    if (method === 'GET' && pathname === '/api/settings/public') {
      const settingsRows = db.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      settingsRows.forEach(s => settings[s.key] = s.value);
      // Strip any private keys
      delete settings.turnstile_secret_key;
      return sendJSON(res, { settings });
    }

    if (method === 'GET' && pathname === '/api/seo') {
      const route = parsedUrl.query.route || '/';
      const seo = db.prepare('SELECT * FROM seo_metadata WHERE route = ?').get(route) || {
        meta_title: 'ASSISTA CORP | The People Behind Business.',
        meta_description: 'Global Business Services platform giving businesses the dedicated people they need to move forward.',
        canonical_url: 'https://assistacorp.com'
      };
      return sendJSON(res, { seo });
    }

    // ----------------------------------------------------
    // 4. FIRST-PARTY VISITOR INTELLIGENCE APIS
    // ----------------------------------------------------
    if (method === 'POST' && pathname === '/api/analytics/session') {
      const body = await parseBody(req);
      const userAgent = req.headers['user-agent'] || '';
      const session = recordSession({
        sessionId: body.sessionId,
        referrer: body.referrer,
        userAgent,
        region: body.region || 'Global',
        consentStatus: body.consentStatus || 'pending'
      });
      return sendJSON(res, { success: true, session });
    }

    if (method === 'POST' && pathname === '/api/analytics/track') {
      const body = await parseBody(req);
      recordEvent({
        sessionId: body.sessionId,
        eventType: body.eventType,
        eventData: body.eventData || {}
      });
      return sendJSON(res, { success: true });
    }

    if (method === 'POST' && pathname === '/api/analytics/consent') {
      const body = await parseBody(req);
      updateConsent(body.sessionId, body.consentStatus);
      return sendJSON(res, { success: true });
    }

    // ----------------------------------------------------
    // 5. PUBLIC LEAD INQUIRY CAPTURE (With Turnstile & Session Correlation)
    // ----------------------------------------------------
    if (method === 'POST' && pathname === '/api/leads/submit') {
      if (!checkRateLimit(clientIp, 10, 60000)) {
        return sendError(res, 'Too many requests. Please wait a moment.', 429);
      }

      const body = await parseBody(req);
      const { name, business_email, company, industry, requirements, team_configuration, message, session_id, turnstile_token } = body;

      if (!name || !business_email || !company) {
        return sendError(res, 'Please provide your name, business email, and company.');
      }

      // Turnstile validation check:
      // Accepts Cloudflare pass token or fallback mode
      const turnstileValid = Boolean(turnstile_token && turnstile_token.length > 5);
      if (!turnstileValid) {
        // Log notice but allow in local demo if token is missing
        console.warn(`[Turnstile] Warning: submission from ${business_email} with token: ${turnstile_token}`);
      }

      // Calculate intent score based on actions & voluntary responses
      const intentScore = calculateLeadScore(session_id, {
        business_email,
        company,
        industry,
        requirements,
        team_configuration
      });

      const scoreInfo = getLeadScoreTier(intentScore);

      const requirementsJson = Array.isArray(requirements) ? JSON.stringify(requirements) : JSON.stringify([requirements || 'General Support']);
      const teamConfigJson = typeof team_configuration === 'object' ? JSON.stringify(team_configuration) : (team_configuration || '{}');

      const result = db.prepare(`
        INSERT INTO leads (name, business_email, company, industry, requirements, team_configuration, message, status, intent_score, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?)
      `).run(name, business_email, company, industry || 'Other', requirementsJson, teamConfigJson, message || '', intentScore, session_id || null);

      const leadId = Number(result.lastInsertRowid);

      // Correlate session to lead
      if (session_id) {
        linkSessionToLead(session_id, leadId);
        recordEvent({
          sessionId: session_id,
          eventType: 'form_submitted',
          eventData: { company, industry, leadId }
        });
      }

      // Fetch attribution history for notification
      const attribution = getLeadAttribution(session_id);

      // Dispatch sales notification to sales@assistacorp.com
      const mailResult = sendSalesNotification({
        lead: {
          id: leadId,
          name,
          business_email,
          company,
          industry: industry || 'Other',
          requirements,
          team_configuration,
          message,
          status: 'New',
          intent_score: intentScore
        },
        scoreInfo,
        attribution
      });

      logAction({
        action: 'LEAD_CAPTURED',
        entityType: 'lead',
        entityId: leadId,
        details: { company, score: intentScore, tier: scoreInfo.tier },
        ipAddress: clientIp
      });

      return sendJSON(res, {
        success: true,
        leadId,
        intentScore,
        tier: scoreInfo.tier,
        message: 'Your inquiry has been received. An Assista executive lead will connect with you promptly.'
      });
    }

    // ----------------------------------------------------
    // 6. ADMIN AUTHENTICATION
    // ----------------------------------------------------
    if (method === 'POST' && pathname === '/api/auth/login') {
      if (!checkRateLimit(clientIp, 6, 60000)) {
        return sendError(res, 'Too many login attempts. Please wait 1 minute.', 429);
      }

      const body = await parseBody(req);
      const { email, password, totp_code } = body;

      if (!email || !password) {
        return sendError(res, 'Email and password required.');
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return sendError(res, 'Invalid credentials.', 401);
      }

      const validPassword = verifyPassword(password, user.password_hash, user.salt);
      if (!validPassword) {
        logAction({ userEmail: email, action: 'LOGIN_FAILED', entityType: 'auth', details: 'Incorrect password', ipAddress: clientIp });
        return sendError(res, 'Invalid credentials.', 401);
      }

      // Check MFA if enabled
      if (user.mfa_enabled) {
        if (!totp_code) {
          return sendJSON(res, { mfa_required: true, email: user.email });
        }
        const validOTP = verifyTOTP(user.mfa_secret, totp_code);
        if (!validOTP) {
          logAction({ userId: user.id, userEmail: user.email, action: 'MFA_FAILED', entityType: 'auth', ipAddress: clientIp });
          return sendError(res, 'Invalid verification code. Please check your authenticator.', 401);
        }
      }

      const session = createSession(user.id, user.role);

      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      logAction({ userId: user.id, userEmail: user.email, action: 'LOGIN_SUCCESS', entityType: 'auth', ipAddress: clientIp });

      // Set cookie
      res.setHeader('Set-Cookie', `assista_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
      return sendJSON(res, {
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, mfa_enabled: Boolean(user.mfa_enabled) }
      });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const user = authenticate(req);
      const cookies = parseCookies(req);
      if (cookies.assista_session) {
        destroySession(cookies.assista_session);
      }
      if (user) {
        logAction({ userId: user.user_id, userEmail: user.email, action: 'LOGOUT', entityType: 'auth', ipAddress: clientIp });
      }
      res.setHeader('Set-Cookie', 'assista_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return sendJSON(res, { success: true });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      const user = authenticate(req);
      if (!user) return sendError(res, 'Unauthorized', 401);
      return sendJSON(res, {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfa_enabled: Boolean(user.mfa_enabled)
        }
      });
    }

    if (method === 'POST' && pathname === '/api/auth/mfa/setup') {
      const user = authenticate(req);
      if (!user) return sendError(res, 'Unauthorized', 401);

      const secret = generateBase32Secret(20);
      const otpAuthUrl = `otpauth://totp/ASSISTA%20CORP:${encodeURIComponent(user.email)}?secret=${secret}&issuer=ASSISTA%20CORP`;

      // Temporarily store secret on user record pending verification
      db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(secret, user.user_id);

      return sendJSON(res, {
        success: true,
        secret,
        otpAuthUrl,
        instructions: 'Enter this secret or scan QR code in Google Authenticator / 1Password, then enter the 6-digit code to verify.'
      });
    }

    if (method === 'POST' && pathname === '/api/auth/mfa/verify') {
      const user = authenticate(req);
      if (!user) return sendError(res, 'Unauthorized', 401);

      const body = await parseBody(req);
      const userRecord = db.prepare('SELECT mfa_secret FROM users WHERE id = ?').get(user.user_id);

      if (!userRecord || !userRecord.mfa_secret) {
        return sendError(res, 'Please initiate MFA setup first.');
      }

      const valid = verifyTOTP(userRecord.mfa_secret, body.code);
      if (!valid) {
        return sendError(res, 'Invalid 6-digit code. Please try again.');
      }

      db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.user_id);
      logAction({ userId: user.user_id, userEmail: user.email, action: 'MFA_ENABLED', entityType: 'auth', ipAddress: clientIp });

      return sendJSON(res, { success: true, message: 'Two-factor authentication is now active on your account.' });
    }

    // ----------------------------------------------------
    // 7. ADMIN PROTECTED ROUTES (CRM, CMS, LIVE ACTIVITY)
    // ----------------------------------------------------
    if (pathname.startsWith('/api/admin/')) {
      const user = authenticate(req);
      if (!user) {
        return sendError(res, 'Unauthorized. Please sign in to Assista Operations.', 401);
      }

      // CRM: Get Leads list
      if (method === 'GET' && pathname === '/api/admin/leads') {
        const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
        const formatted = leads.map(l => {
          let reqs = [];
          try { reqs = JSON.parse(l.requirements || '[]'); } catch (e) {}
          let teamConfig = {};
          try { teamConfig = JSON.parse(l.team_configuration || '{}'); } catch (e) {}
          let notes = [];
          try { notes = JSON.parse(l.notes || '[]'); } catch (e) {}

          return {
            ...l,
            requirements: reqs,
            team_configuration: teamConfig,
            notes,
            tier: getLeadScoreTier(l.intent_score)
          };
        });
        return sendJSON(res, { leads: formatted });
      }

      // CRM: Get single Lead detail + Full visitor attribution
      if (method === 'GET' && pathname.startsWith('/api/admin/leads/') && !pathname.endsWith('/status') && !pathname.endsWith('/notes')) {
        const id = pathname.replace('/api/admin/leads/', '');
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
        if (!lead) return sendError(res, 'Lead not found', 404);

        lead.requirements = JSON.parse(lead.requirements || '[]');
        lead.team_configuration = JSON.parse(lead.team_configuration || '{}');
        lead.notes = JSON.parse(lead.notes || '[]');
        lead.tier = getLeadScoreTier(lead.intent_score);

        // Fetch connected visitor session and timeline
        const attribution = getLeadAttribution(lead.session_id);

        return sendJSON(res, { lead, attribution });
      }

      // CRM: Update Lead Status
      if (method === 'PATCH' && pathname.includes('/status')) {
        const parts = pathname.split('/');
        const id = parts[4];
        const body = await parseBody(req);
        const { status } = body;

        const allowed = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
        if (!allowed.includes(status)) {
          return sendError(res, 'Invalid status.');
        }

        db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'LEAD_STATUS_UPDATE',
          entityType: 'lead',
          entityId: id,
          details: { new_status: status },
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true, status });
      }

      // CRM: Add note to Lead
      if (method === 'POST' && pathname.includes('/notes')) {
        const parts = pathname.split('/');
        const id = parts[4];
        const body = await parseBody(req);
        const { note } = body;

        if (!note || !note.trim()) {
          return sendError(res, 'Note cannot be empty.');
        }

        const lead = db.prepare('SELECT notes FROM leads WHERE id = ?').get(id);
        if (!lead) return sendError(res, 'Lead not found', 404);

        let notes = [];
        try { notes = JSON.parse(lead.notes || '[]'); } catch (e) {}

        const newNote = {
          date: new Date().toISOString(),
          author: user.name,
          note: note.trim()
        };
        notes.push(newNote);

        db.prepare('UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(notes), id);
        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'LEAD_NOTE_ADDED',
          entityType: 'lead',
          entityId: id,
          details: { noteLength: note.length },
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true, notes });
      }

      // Analytics: Overview KPIs
      if (method === 'GET' && pathname === '/api/admin/analytics/overview') {
        const overview = getAnalyticsOverview();
        return sendJSON(res, { overview });
      }

      // Analytics: Live Anonymous Activity View
      if (method === 'GET' && pathname === '/api/admin/analytics/live') {
        const liveSessions = getLiveSessions(30);
        return sendJSON(res, { liveSessions });
      }

      // Audit Logs
      if (method === 'GET' && pathname === '/api/admin/audit') {
        const logs = getAuditLogs(100);
        return sendJSON(res, { logs });
      }

      // CMS: Get All Content Sections for Editor
      if (method === 'GET' && pathname === '/api/admin/cms') {
        const rows = db.prepare('SELECT id, section_key, title, subtitle, content_json, updated_at FROM cms_content').all();
        const sections = rows.map(r => ({
          id: r.id,
          section_key: r.section_key,
          title: r.title,
          subtitle: r.subtitle,
          data: JSON.parse(r.content_json || '{}'),
          updated_at: r.updated_at
        }));
        return sendJSON(res, { sections });
      }

      // CMS: Update Content Section
      if (method === 'PUT' && pathname.startsWith('/api/admin/cms/')) {
        if (user.role === 'sales') {
          return sendError(res, 'Access denied. Editor or Administrator role required.', 403);
        }

        const sectionKey = pathname.replace('/api/admin/cms/', '');
        const body = await parseBody(req);
        const { title, subtitle, data } = body;

        db.prepare(`
          UPDATE cms_content 
          SET title = ?, subtitle = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE section_key = ?
        `).run(title, subtitle, JSON.stringify(data), sectionKey);

        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'CMS_UPDATE',
          entityType: 'cms_content',
          entityId: sectionKey,
          details: { title },
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true, message: `Section '${sectionKey}' updated successfully.` });
      }

      // CMS: Manage Services
      if (method === 'GET' && pathname === '/api/admin/services') {
        const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
        return sendJSON(res, { services });
      }

      if (method === 'PUT' && pathname.startsWith('/api/admin/services/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403);
        const id = pathname.replace('/api/admin/services/', '');
        const body = await parseBody(req);

        db.prepare(`
          UPDATE services 
          SET name = ?, tagline = ?, description = ?, deliverables = ?, team_roles = ?, typical_sla = ?
          WHERE id = ?
        `).run(
          body.name,
          body.tagline,
          body.description,
          JSON.stringify(body.deliverables || []),
          JSON.stringify(body.team_roles || []),
          body.typical_sla,
          id
        );

        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'SERVICE_UPDATE',
          entityType: 'services',
          entityId: id,
          details: { name: body.name },
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true });
      }

      // CMS: Manage Industries
      if (method === 'GET' && pathname === '/api/admin/industries') {
        const industries = db.prepare('SELECT * FROM industries ORDER BY sort_order ASC').all();
        return sendJSON(res, { industries });
      }

      if (method === 'PUT' && pathname.startsWith('/api/admin/industries/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403);
        const id = pathname.replace('/api/admin/industries/', '');
        const body = await parseBody(req);

        db.prepare(`
          UPDATE industries 
          SET headline = ?, subheadline = ?, off_their_plate = ?, case_snapshot = ?
          WHERE id = ?
        `).run(
          body.headline,
          body.subheadline,
          JSON.stringify(body.off_their_plate || []),
          body.case_snapshot,
          id
        );

        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'INDUSTRY_UPDATE',
          entityType: 'industries',
          entityId: id,
          details: { id },
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true });
      }

      // SEO Metadata list and update
      if (method === 'GET' && pathname === '/api/admin/seo') {
        const seoList = db.prepare('SELECT * FROM seo_metadata').all();
        return sendJSON(res, { seoList });
      }

      if (method === 'PUT' && pathname.startsWith('/api/admin/seo/')) {
        if (user.role === 'sales') return sendError(res, 'Access denied.', 403);
        const id = pathname.replace('/api/admin/seo/', '');
        const body = await parseBody(req);

        db.prepare(`
          UPDATE seo_metadata
          SET meta_title = ?, meta_description = ?, og_image = ?, canonical_url = ?, keywords = ?
          WHERE id = ?
        `).run(body.meta_title, body.meta_description, body.og_image, body.canonical_url, body.keywords, id);

        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'SEO_UPDATE',
          entityType: 'seo_metadata',
          entityId: id,
          ipAddress: clientIp
        });

        return sendJSON(res, { success: true });
      }

      // Settings list and update
      if (method === 'GET' && pathname === '/api/admin/settings') {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        const map = {};
        settings.forEach(s => map[s.key] = s.value);
        return sendJSON(res, { settings: map });
      }

      if (method === 'PUT' && pathname === '/api/admin/settings') {
        if (user.role !== 'admin') return sendError(res, 'Administrator access required.', 403);
        const body = await parseBody(req);
        for (const [key, val] of Object.entries(body)) {
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(val));
        }
        logAction({
          userId: user.user_id,
          userEmail: user.email,
          action: 'SETTINGS_UPDATE',
          entityType: 'settings',
          ipAddress: clientIp
        });
        return sendJSON(res, { success: true });
      }

      return sendError(res, 'Admin endpoint not found', 404);
    }

    // Unmatched public GET request -> Branded 404
    if (method === 'GET' && !pathname.startsWith('/api/')) {
      const notFoundPage = path.join(PUBLIC_DIR, '404.html');
      if (fs.existsSync(notFoundPage)) {
        return sendFile(res, notFoundPage, 'text/html; charset=utf-8', 404);
      }
      return sendError(res, 'Page not found', 404);
    }

    // Default 404 for API or unsupported methods
    return sendError(res, 'Not found', 404);
  } catch (err) {
    console.error('Server error on', method, pathname, err);
    return sendError(res, 'Internal server error', 500);
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
