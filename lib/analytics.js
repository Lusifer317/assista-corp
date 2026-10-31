const { db } = require('./db');

const SESSION_ID_RE = /^ses_[a-z0-9]{12,96}$/i;
const EVENT_KEYS = Object.freeze({
  page_view: ['path', 'title'],
  dwell_milestone: ['duration'],
  behind_business_toggle: ['label'],
  contact_opened: ['source'],
  industry_view: ['industry'],
  service_view: ['category', 'service'],
  team_builder_interaction: ['selected_roles', 'team_size'],
  booking_action: ['source'],
  form_submitted: ['industry']
});

function parseUserAgent(ua = '') {
  ua = String(ua).toLowerCase();
  let device = 'Desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) device = 'Mobile';
  else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) device = 'Tablet';
  let browser = 'Browser';
  if (/edg\//.test(ua)) browser = 'Edge';
  else if (/opr\/|opera\//.test(ua)) browser = 'Opera';
  else if (/chrome\//.test(ua)) browser = 'Chrome';
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = 'Safari';
  else if (/firefox\//.test(ua)) browser = 'Firefox';
  return { device, browser };
}

function safeReferrer(value) {
  if (!value || value === 'Direct / Bookmark') return 'Direct / Bookmark';
  try {
    const parsed = new URL(String(value));
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'Direct / Bookmark';
    return parsed.origin.slice(0, 200);
  } catch {
    return 'Direct / Bookmark';
  }
}

function safeRegion(value) {
  if (typeof value !== 'string') return 'Global';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80) || 'Global';
}

function recordSession({ sessionId, referrer = '', userAgent = '', region = 'Global', consentStatus = 'pending' }) {
  if (consentStatus !== 'granted' || typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) return null;
  const { device, browser } = parseUserAgent(userAgent);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT session_id, consent_status FROM visitor_sessions WHERE session_id = ?').get(sessionId);
  if (existing) {
    if (existing.consent_status !== 'granted') return null;
    db.prepare('UPDATE visitor_sessions SET last_seen = ? WHERE session_id = ?').run(now, sessionId);
    return existing;
  }
  db.prepare('INSERT INTO visitor_sessions (session_id, first_seen, last_seen, referrer, device_category, browser, region, consent_status, path_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sessionId, now, now, safeReferrer(referrer), device, browser, safeRegion(region), 'granted', JSON.stringify([]));
  return { session_id: sessionId, device_category: device, browser, region: safeRegion(region), consent_status: 'granted' };
}

function sanitizeEventData(eventType, eventData) {
  const allowed = EVENT_KEYS[eventType];
  if (!allowed || !eventData || typeof eventData !== 'object' || Array.isArray(eventData)) return null;
  const clean = {};
  for (const key of allowed) {
    const value = eventData[key];
    if (value === undefined || value === null) continue;
    if (key === 'duration' || key === 'team_size') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 10000) return null;
      clean[key] = Math.round(n);
    } else if (key === 'selected_roles') {
      if (!Array.isArray(value) || value.length > 12 || value.some(v => typeof v !== 'string')) return null;
      clean[key] = value.map(v => v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80));
    } else if (typeof value === 'string') {
      let text = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200);
      if (key === 'path') {
        if (!text.startsWith('/')) return null;
        text = text.split(/[?#]/, 1)[0].slice(0, 160) || '/';
      }
      clean[key] = text;
    } else {
      return null;
    }
  }
  if (Buffer.byteLength(JSON.stringify(clean), 'utf8') > 1024) return null;
  return clean;
}

function recordEvent({ sessionId, eventType, eventData = {} }) {
  if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) return false;
  const session = db.prepare('SELECT consent_status FROM visitor_sessions WHERE session_id = ?').get(sessionId);
  if (!session || session.consent_status !== 'granted') return false;
  const sanitized = sanitizeEventData(eventType, eventData);
  if (!sanitized) return false;
  db.prepare('INSERT INTO analytics_events (session_id, event_type, event_data) VALUES (?, ?, ?)')
    .run(sessionId, eventType, JSON.stringify(sanitized));
  const now = new Date().toISOString();
  if (eventType === 'page_view' && sanitized.path) {
    const current = db.prepare('SELECT path_history FROM visitor_sessions WHERE session_id = ?').get(sessionId);
    let paths = [];
    try { paths = JSON.parse(current?.path_history || '[]'); } catch {}
    if (paths[paths.length - 1] !== sanitized.path) {
      paths.push(sanitized.path);
      if (paths.length > 25) paths = paths.slice(-25);
    }
    db.prepare('UPDATE visitor_sessions SET last_seen = ?, path_history = ? WHERE session_id = ?')
      .run(now, JSON.stringify(paths), sessionId);
  } else {
    db.prepare('UPDATE visitor_sessions SET last_seen = ? WHERE session_id = ?').run(now, sessionId);
  }
  return true;
}

function updateConsent(sessionId, consentStatus) {
  if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId) || !['granted', 'rejected'].includes(consentStatus)) return false;
  if (consentStatus === 'rejected') {
    db.prepare('DELETE FROM analytics_events WHERE session_id = ?').run(sessionId);
    db.prepare('UPDATE leads SET session_id = NULL WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM visitor_sessions WHERE session_id = ?').run(sessionId);
    return true;
  }
  const result = db.prepare("UPDATE visitor_sessions SET consent_status = 'granted' WHERE session_id = ?").run(sessionId);
  return Number(result.changes) > 0;
}

function getLiveSessions(limitMinutes = 30) {
  const cutoff = new Date(Date.now() - limitMinutes * 60 * 1000).toISOString();
  const sessions = db.prepare("SELECT s.session_id, s.first_seen, s.last_seen, s.referrer, s.device_category, s.browser, s.region, s.consent_status, s.path_history, s.lead_id, (SELECT COUNT(*) FROM analytics_events e WHERE e.session_id = s.session_id) as event_count, (SELECT event_type FROM analytics_events e WHERE e.session_id = s.session_id ORDER BY e.id DESC LIMIT 1) as last_event, (SELECT event_data FROM analytics_events e WHERE e.session_id = s.session_id ORDER BY e.id DESC LIMIT 1) as last_event_data FROM visitor_sessions s WHERE s.consent_status = 'granted' AND s.last_seen >= ? ORDER BY s.last_seen DESC LIMIT 50").all(cutoff);
  return sessions.map(s => {
    let paths = [];
    try { paths = JSON.parse(s.path_history || '[]'); } catch {}
    let lastData = {};
    try { lastData = JSON.parse(s.last_event_data || '{}'); } catch {}
    const start = new Date(s.first_seen).getTime();
    const end = new Date(s.last_seen).getTime();
    return {
      session_id: s.session_id,
      display_id: 'VISITOR-' + s.session_id.slice(0, 6).toUpperCase(),
      first_seen: s.first_seen,
      last_seen: s.last_seen,
      dwell_seconds: Math.max(1, Math.round((end - start) / 1000)),
      referrer: s.referrer,
      device_category: s.device_category,
      browser: s.browser,
      region: s.region,
      consent_status: s.consent_status,
      current_page: paths.length ? paths[paths.length - 1] : '/',
      paths,
      event_count: s.event_count,
      last_event: s.last_event,
      last_event_data: lastData,
      is_converted_lead: Boolean(s.lead_id)
    };
  });
}

function getAnalyticsOverview() {
  const totalSessions = db.prepare("SELECT COUNT(*) as count FROM visitor_sessions WHERE consent_status = 'granted'").get().count;
  const totalEvents = db.prepare("SELECT COUNT(*) as count FROM analytics_events e JOIN visitor_sessions s ON s.session_id = e.session_id WHERE s.consent_status = 'granted'").get().count;
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const past24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const sessions24h = db.prepare("SELECT COUNT(*) as count FROM visitor_sessions WHERE consent_status = 'granted' AND last_seen >= ?").get(past24h).count;
  const industryEvents = db.prepare("SELECT json_extract(e.event_data, '$.industry') as industry, COUNT(*) as count FROM analytics_events e JOIN visitor_sessions s ON s.session_id = e.session_id WHERE s.consent_status = 'granted' AND e.event_type = 'industry_view' AND json_extract(e.event_data, '$.industry') IS NOT NULL GROUP BY industry ORDER BY count DESC LIMIT 6").all();
  const capabilityEvents = db.prepare("SELECT json_extract(e.event_data, '$.category') as category, COUNT(*) as count FROM analytics_events e JOIN visitor_sessions s ON s.session_id = e.session_id WHERE s.consent_status = 'granted' AND e.event_type = 'service_view' AND json_extract(e.event_data, '$.category') IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 4").all();
  const devices = db.prepare("SELECT device_category, COUNT(*) as count FROM visitor_sessions WHERE consent_status = 'granted' GROUP BY device_category").all();
  const highIntentActions = db.prepare("SELECT e.event_type, COUNT(*) as count FROM analytics_events e JOIN visitor_sessions s ON s.session_id = e.session_id WHERE s.consent_status = 'granted' AND e.event_type IN ('team_builder_interaction', 'behind_business_toggle', 'contact_opened', 'form_submitted', 'booking_action') GROUP BY e.event_type").all();
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

module.exports = { recordSession, recordEvent, updateConsent, getLiveSessions, getAnalyticsOverview, sanitizeEventData };