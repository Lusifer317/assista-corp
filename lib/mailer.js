const { db } = require('./db');

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

function buildLeadEmail({ lead, scoreInfo, attribution }) {
  const recipient = process.env.MS_GRAPH_RECIPIENT || 'sales@assistacorp.com';
  const sender = process.env.MS_GRAPH_SENDER || 'hr@assistacorp.com';
  const subject = `[ASSISTA NEW LEAD] ${lead.name} from ${lead.company} (Score: ${lead.intent_score} - ${scoreInfo.tier})`;

  let disciplinesText = 'None specified';
  try {
    const config = typeof lead.team_configuration === 'string' ? JSON.parse(lead.team_configuration) : lead.team_configuration;
    if (config?.disciplines?.length > 0) disciplinesText = config.disciplines.join(', ');
  } catch {}

  const bodyPlain = [
    'ASSISTA CORP — NEW EXECUTIVE INQUIRY RECEIVED',
    '',
    `Lead ID: #${lead.id}`,
    `Status: ${lead.status}`,
    `Intent Score: ${lead.intent_score} / 100 (${scoreInfo.tier} - ${scoreInfo.label})`,
    '',
    'CONTACT DETAILS:',
    `Name: ${lead.name}`,
    `Business Email: ${lead.business_email}`,
    `Company: ${lead.company}`,
    `Industry: ${lead.industry}`,
    '',
    'TEAM & CAPABILITY REQUIREMENTS:',
    `Configured Disciplines: ${disciplinesText}`,
    `Requirements: ${Array.isArray(lead.requirements) ? lead.requirements.join(', ') : lead.requirements}`,
    '',
    'MESSAGE:',
    lead.message || '(No extra notes provided)',
    '',
    'ATTRIBUTION & VISITOR INTELLIGENCE:',
    `Referrer: ${attribution?.session?.referrer || 'Direct'}`,
    `Device: ${attribution?.session?.device_category || 'Desktop'} (${attribution?.session?.browser || 'Browser'})`,
    `Total Prior Touchpoints: ${attribution?.events?.length || 0} events`,
    `Admin Lead Dossier: /admin#lead-${lead.id}`
  ].join('\n');

  return { sender, recipient, subject, bodyPlain };
}

async function getGraphToken() {
  const tenant = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) return null;

  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: GRAPH_SCOPE,
      grant_type: 'client_credentials'
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) throw new Error(`Microsoft identity token request failed: HTTP ${response.status}`);
  const result = await response.json();
  if (!result.access_token) throw new Error('Microsoft identity token response did not contain an access token');
  return result.access_token;
}

async function sendSalesNotification({ lead, scoreInfo, attribution }) {
  const email = buildLeadEmail({ lead, scoreInfo, attribution });
  const configured = Boolean(process.env.MS_GRAPH_TENANT_ID && process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET);
  let sent = false;
  let mode = configured ? 'microsoft-graph' : 'audit-only';
  let error = null;

  if (configured) {
    try {
      const token = await getGraphToken();
      const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email.sender)}/sendMail`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject: email.subject,
            body: { contentType: 'Text', content: email.bodyPlain },
            toRecipients: [{ emailAddress: { address: email.recipient } }],
            replyTo: [{ emailAddress: { address: lead.business_email } }]
          },
          saveToSentItems: true
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Microsoft Graph sendMail failed: HTTP ${response.status} ${responseText.slice(0, 300)}`);
      }
      sent = true;
    } catch (err) {
      error = err.message;
      console.error('[ASSISTA MAILER] Microsoft Graph delivery failed:', error);
    }
  }

  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (NULL, 'system@assistacorp.com', 'EMAIL_DISPATCH', 'lead', ?, ?, '127.0.0.1')
    `).run(String(lead.id), JSON.stringify({ recipient: email.recipient, sender: email.sender, subject: email.subject, score: lead.intent_score, sent, mode, error }));
  } catch (err) {
    console.error('Failed to log email audit:', err);
  }

  if (!sent && configured) console.error(`[ASSISTA MAILER] Lead ${lead.id} was captured but notification delivery failed.`);
  if (!configured) console.warn('[ASSISTA MAILER] Microsoft Graph is not configured; lead notification was audit-logged only.');

  return { success: sent, sent, mode, recipient: email.recipient, subject: email.subject, preview: email.bodyPlain, error };
}

module.exports = { sendSalesNotification };
