const { db } = require('./db');

// In-memory / DB notification outbox
function sendSalesNotification({ lead, scoreInfo, attribution }) {
  const recipient = 'sales@assistacorp.com';
  const subject = `[ASSISTA NEW LEAD] ${lead.name} from ${lead.company} (Score: ${lead.intent_score} - ${scoreInfo.tier})`;

  let disciplinesText = 'None specified';
  try {
    const config = typeof lead.team_configuration === 'string' ? JSON.parse(lead.team_configuration) : lead.team_configuration;
    if (config?.disciplines?.length > 0) {
      disciplinesText = config.disciplines.join(', ');
    }
  } catch (e) {}

  const bodyPlain = `
======================================================
ASSISTA CORP — NEW EXECUTIVE INQUIRY RECEIVED
======================================================
Lead ID: #${lead.id}
Status: ${lead.status}
Intent Score: ${lead.intent_score} / 100 (${scoreInfo.tier} - ${scoreInfo.label})

CONTACT DETAILS:
Name: ${lead.name}
Business Email: ${lead.business_email}
Company: ${lead.company}
Industry: ${lead.industry}

TEAM & CAPABILITY REQUIREMENTS:
Configured Disciplines: ${disciplinesText}
Requirements: ${Array.isArray(lead.requirements) ? lead.requirements.join(', ') : lead.requirements}

MESSAGE:
${lead.message || '(No extra notes provided)'}

ATTRIBUTION & VISITOR INTELLIGENCE:
Referrer: ${attribution?.session?.referrer || 'Direct'}
Device: ${attribution?.session?.device_category || 'Desktop'} (${attribution?.session?.browser || 'Browser'})
Total Prior Touchpoints: ${attribution?.events?.length || 0} events
Admin Lead Dossier: /admin#lead-${lead.id}
======================================================
`;

  // Log to DB audit / settings for inspection
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (NULL, 'system@assistacorp.com', 'EMAIL_DISPATCH', 'lead', ?, ?, '127.0.0.1')
    `).run(String(lead.id), JSON.stringify({ recipient, subject, score: lead.intent_score }));
  } catch (err) {
    console.error('Failed to log email audit:', err);
  }

  console.log(`[ASSISTA MAILER] Notification dispatched to ${recipient}: ${subject}`);
  return { success: true, recipient, subject, preview: bodyPlain };
}

module.exports = {
  sendSalesNotification
};
