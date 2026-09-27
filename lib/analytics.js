const { db } = require('./db');

function parseUserAgent(ua = '') {
  ua = ua.toLowerCase();
  let device = 'Desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) {
    device = 'Tablet';
  }

  let browser = 'Browser';
  if (/edg\//.test(ua)) browser = 'Edge';
  else if (/chrome\//.test(ua)) browser = 'Chrome';
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = 'Safari';
  else if (/firefox\//.test(ua)) browser = 'Firefox';
  else if (/opr\/|opera\//.test(ua)) browser = 'Opera';

  return { device, browser };
}

function recordSession({ sessionId, referrer = '', userAgent = '', region = 'Global', consentStatus = 'pending' }) {
  if (!sessionId) return null;

  const { device, browser } = parseUserAgent(userAgent);
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT session_id, consent_status, path_history FROM visitor_sessions WHERE session_id = ?').get(sessionId);

  if (existing) {
    db.prepare(`
      UPDATE visitor_sessions 
      SET last_seen = ?, consent_status = COALESCE(NULLIF(?, 'pending'), consent_status)
      WHERE session_id = ?
    `).run(now, consentStatus, sessionId);
    return existing;
  } else {
    db.prepare(`
      INSERT INTO visitor_sessions (session_id, first_seen, last_seen, referrer, device_category, browser, region, consent_status, path_history)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, now, now, referrer || 'Direct / Organic', device, browser, region, consentStatus, JSON.stringify([]));
    return { session_id: sessionId, device_category: device, browser, region, consent_status: consentStatus };
  }
}

function recordEvent({ sessionId, eventType, eventData = {} }) {
  if (!sessionId || !eventType) return;

  // Security check: explicitly sanitize to ensure NO sensitive personal or medical info is accepted
  const sanitized = {};
  const allowedKeys = [
    'path', 'title', 'service', 'category', 'industry', 
    'action', 'label', 'duration', 'scroll_depth', 
    'selected_roles', 'team_size', 'source'
  ];
  for (const k of allowedKeys) {
    if (eventData[k] !== undefined) {
      sanitized[k] = typeof eventData[k] === 'string' ? eventData[k].slice(0, 200) : eventData[k];
    }
  }

  // Insert event
  db.prepare(`
    INSERT INTO analytics_events (session_id, event_type, event_data)
    VALUES (?, ?, ?)
  `).run(sessionId, eventType, JSON.stringify(sanitized));

  // Update session last_seen and append path if page_view
  const now = new Date().toISOString();
  if (eventType === 'page_view' && sanitized.path) {
    const session = db.prepare('SELECT path_history FROM visitor_sessions WHERE session_id = ?').get(sessionId);
    if (session) {
      let paths = [];
      try { paths = JSON.parse(session.path_history || '[]'); } catch (e) { paths = []; }
      if (paths[paths.length - 1] !== sanitized.path) {
        paths.push(sanitized.path);
        // Keep last 25 navigation steps
        if (paths.length > 25) paths = paths.slice(-25);
      }
      db.prepare(`
        UPDATE visitor_sessions 
        SET last_seen = ?, path_history = ? 
        WHERE session_id = ?
      `).run(now, JSON.stringify(paths), sessionId);
      return;
    }
  }

  db.prepare('UPDATE visitor_sessions SET last_seen = ? WHERE session_id = ?').run(now, sessionId);
}

function updateConsent(sessionId, consentStatus) {
  if (!sessionId) return;
  db.prepare('UPDATE visitor_sessions SET consent_status = ? WHERE session_id = ?').run(consentStatus, sessionId);
}

function getLiveSessions(limitMinutes = 30) {
  // Query sessions active in the last `limitMinutes`
  const cutoff = new Date(Date.now() - limitMinutes * 60 * 1000).toISOString();

  const sessions = db.prepare(`
    SELECT s.session_id, s.first_seen, s.last_seen, s.referrer, s.device_category, s.browser, s.region, s.consent_status, s.path_history, s.lead_id,
           (SELECT COUNT(*) FROM analytics_events e WHERE e.session_id = s.session_id) as event_count,
           (SELECT event_type FROM analytics_events e WHERE e.session_id = s.session_id ORDER BY e.id DESC LIMIT 1) as last_event,
           (SELECT event_data FROM analytics_events e WHERE e.session_id = s.session_id ORDER BY e.id DESC LIMIT 1) as last_event_data
    FROM visitor_sessions s
    WHERE s.last_seen >= ?
    ORDER BY s.last_seen DESC
    LIMIT 50
  `).all(cutoff);

  return sessions.map(s => {
    let paths = [];
    try { paths = JSON.parse(s.path_history || '[]'); } catch (e) { paths = []; }
    let lastData = {};
    try { lastData = JSON.parse(s.last_event_data || '{}'); } catch (e) { lastData = {}; }

    // Mask session id for anonymous privacy (e.g., "Visitor #8f2a")
    const shortHash = 'VISITOR-' + s.session_id.slice(0, 6).toUpperCase();

    // Dwell duration in minutes
    const start = new Date(s.first_seen).getTime();
    const end = new Date(s.last_seen).getTime();
    const dwellSeconds = Math.max(1, Math.round((end - start) / 1000));

    return {
      session_id: s.session_id,
      display_id: shortHash,
      first_seen: s.first_seen,
      last_seen: s.last_seen,
      dwell_seconds: dwellSeconds,
      referrer: s.referrer,
      device_category: s.device_category,
      browser: s.browser,
      region: s.region,
      consent_status: s.consent_status,
      current_page: paths.length > 0 ? paths[paths.length - 1] : '/',
      paths,
      event_count: s.event_count,
      last_event: s.last_event,
      last_event_data: lastData,
      is_converted_lead: Boolean(s.lead_id)
    };
  });
}

function getAnalyticsOverview() {
  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM visitor_sessions').get().count;
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM analytics_events').get().count;
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;

  // Active in last 24 hours
  const past24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const sessions24h = db.prepare('SELECT COUNT(*) as count FROM visitor_sessions WHERE last_seen >= ?').get(past24h).count;

  // Top industries explored
  const industryEvents = db.prepare(`
    SELECT json_extract(event_data, '$.industry') as industry, COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'industry_view' AND json_extract(event_data, '$.industry') IS NOT NULL
    GROUP BY industry
    ORDER BY count DESC
    LIMIT 6
  `).all();

  // Top capabilities explored
  const capabilityEvents = db.prepare(`
    SELECT json_extract(event_data, '$.category') as category, COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'service_view' AND json_extract(event_data, '$.category') IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
    LIMIT 4
  `).all();

  // Device Breakdown
  const devices = db.prepare(`
    SELECT device_category, COUNT(*) as count
    FROM visitor_sessions
    GROUP BY device_category
  `).all();

  // High Intent Actions (Team builder used, behind business explored, contact opened)
  const highIntentActions = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM analytics_events
    WHERE event_type IN ('team_builder_interaction', 'behind_business_toggle', 'contact_opened', 'form_submitted', 'booking_action')
    GROUP BY event_type
  `).all();

  return {
    totalSessions,
    sessions24h,
    totalEvents,
    totalLeads,
    conversionRate: totalSessions > 0 ? ((totalLeads / totalSessions) * 100).toFixed(1) : 0,
    industryEvents,
    capabilityEvents,
    devices,
    highIntentActions
  };
}

module.exports = {
  recordSession,
  recordEvent,
  updateConsent,
  getLiveSessions,
  getAnalyticsOverview
};
