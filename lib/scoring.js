const { db } = require('./db');

const GENERIC_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'mail.com', 'protonmail.com', 'aol.com'
];

function isCorporateEmail(email = '') {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return false;
  return !GENERIC_EMAIL_DOMAINS.includes(parts[1]);
}

function calculateLeadScore(sessionId, leadData) {
  let score = 25; // Base score for completing inquiry

  // Corporate email check
  if (isCorporateEmail(leadData.business_email)) {
    score += 15;
  }

  // Company and Industry clarity
  if (leadData.company && leadData.company.trim().length > 2) {
    score += 5;
  }
  if (leadData.industry && leadData.industry !== 'Other') {
    score += 5;
  }

  // Team Configuration
  let teamConfig = {};
  try {
    teamConfig = typeof leadData.team_configuration === 'string' 
      ? JSON.parse(leadData.team_configuration || '{}') 
      : (leadData.team_configuration || {});
  } catch (e) {
    teamConfig = {};
  }

  if (teamConfig.disciplines && teamConfig.disciplines.length > 0) {
    score += 20; // Used the interactive Build Your Support Team simulator
    if (teamConfig.disciplines.length >= 3) {
      score += 5; // Multi-discipline requirement
    }
  }

  // Check visitor session behavior if sessionId is valid
  if (sessionId) {
    const events = db.prepare('SELECT event_type, event_data FROM analytics_events WHERE session_id = ?').all(sessionId);
    
    const eventTypes = events.map(e => e.event_type);

    // Explored "Behind the Business" signature interactive reveal
    if (eventTypes.includes('behind_business_toggle')) {
      score += 10;
    }

    // Explored specialized support
    const hasSpecialized = events.some(e => {
      try {
        const d = JSON.parse(e.event_data || '{}');
        return d.category === 'Specialized Support' || d.service?.includes('cyber') || d.service?.includes('finance');
      } catch (err) {
        return false;
      }
    });
    if (hasSpecialized) {
      score += 10;
    }

    // Number of distinct page views
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    if (pageViews >= 4) {
      score += 5;
    }

    // Multiple industry investigations
    const industryCount = new Set(
      events.filter(e => e.event_type === 'industry_view')
            .map(e => {
              try { return JSON.parse(e.event_data).industry; } catch (err) { return null; }
            }).filter(Boolean)
    ).size;
    if (industryCount >= 2) {
      score += 5;
    }
  }

  return Math.min(100, score);
}

function getLeadScoreTier(score) {
  if (score >= 85) return { tier: 'Hot Intent', label: 'Immediate Outreach', color: '#D97753' };
  if (score >= 65) return { tier: 'High Potential', label: 'Priority Follow-up', color: '#B36D38' };
  if (score >= 45) return { tier: 'Warm', label: 'Standard Follow-up', color: '#667085' };
  return { tier: 'Nurture', label: 'Low Intent / General', color: '#98A2B3' };
}

function linkSessionToLead(sessionId, leadId) {
  if (!sessionId || !leadId) return;
  db.prepare('UPDATE visitor_sessions SET lead_id = ? WHERE session_id = ?').run(leadId, sessionId);
}

function getLeadAttribution(sessionId) {
  if (!sessionId) return { events: [], pathHistory: [], referrer: 'Direct' };

  const session = db.prepare(`
    SELECT referrer, device_category, browser, region, first_seen, last_seen, path_history 
    FROM visitor_sessions 
    WHERE session_id = ?
  `).get(sessionId);

  const events = db.prepare(`
    SELECT event_type, event_data, created_at 
    FROM analytics_events 
    WHERE session_id = ? 
    ORDER BY id ASC
  `).all(sessionId);

  let paths = [];
  try { paths = JSON.parse(session?.path_history || '[]'); } catch (e) { paths = []; }

  const formattedEvents = events.map(e => {
    let data = {};
    try { data = JSON.parse(e.event_data || '{}'); } catch (err) { data = {}; }
    return {
      type: e.event_type,
      data,
      timestamp: e.created_at
    };
  });

  return {
    session,
    paths,
    events: formattedEvents
  };
}

module.exports = {
  calculateLeadScore,
  getLeadScoreTier,
  linkSessionToLead,
  getLeadAttribution
};
