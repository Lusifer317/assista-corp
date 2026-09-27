const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = Object.freeze({ name: 120, email: 254, company: 160, industry: 80, message: 5000, requirements: 1000, teamConfiguration: 5000 });

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function validateLeadInput(body) {
  const name = cleanString(body?.name, MAX.name);
  const business_email = cleanString(body?.business_email, MAX.email).toLowerCase();
  const company = cleanString(body?.company, MAX.company);
  const industry = cleanString(body?.industry, MAX.industry) || 'Other';
  const message = cleanString(body?.message, MAX.message);

  if (!name || !business_email || !company) return { ok: false, error: 'Name, business email, and company are required.' };
  if (!EMAIL_RE.test(business_email)) return { ok: false, error: 'Please provide a valid business email address.' };

  const requirements = Array.isArray(body?.requirements)
    ? body.requirements.filter(v => typeof v === 'string').map(v => v.trim().slice(0, 200)).filter(Boolean).slice(0, 20)
    : [cleanString(body?.requirements, MAX.requirements)].filter(Boolean);

  let team_configuration = {};
  if (body?.team_configuration && typeof body.team_configuration === 'object' && !Array.isArray(body.team_configuration)) {
    team_configuration = JSON.parse(JSON.stringify(body.team_configuration));
  } else if (typeof body?.team_configuration === 'string') {
    try {
      const parsed = JSON.parse(body.team_configuration);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) team_configuration = parsed;
    } catch {}
  }

  const serializedTeam = JSON.stringify(team_configuration);
  if (serializedTeam.length > MAX.teamConfiguration) return { ok: false, error: 'Team configuration is too large.' };

  return {
    ok: true,
    value: {
      name,
      business_email,
      company,
      industry,
      requirements,
      team_configuration,
      message,
      session_id: cleanString(body?.session_id, 128),
      turnstile_token: typeof body?.turnstile_token === 'string' ? body.turnstile_token.slice(0, 4096) : ''
    }
  };
}

function validateAdminNote(body) {
  const note = cleanString(body?.note, 2000);
  return note ? { ok: true, value: note } : { ok: false, error: 'Note cannot be empty.' };
}

module.exports = { validateLeadInput, validateAdminNote };