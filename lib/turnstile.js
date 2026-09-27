const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token, remoteIp, options = {}) {
  const secret = process.env.TURNSTILE_SECRET_KEY || '';
  const expectedAction = options.action || process.env.TURNSTILE_EXPECTED_ACTION || '';
  const expectedHostname = options.hostname || process.env.TURNSTILE_EXPECTED_HOSTNAME || '';

  if (!secret || typeof token !== 'string' || token.length < 10 || token.length > 4096) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== '127.0.0.1' && remoteIp !== '::1') body.set('remoteip', remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return false;
    const result = await response.json();
    if (result.success !== true) return false;
    if (expectedAction && result.action !== expectedAction) return false;
    if (expectedHostname && result.hostname !== expectedHostname) return false;
    return true;
  } catch {
    return false;
  }
}

module.exports = { verifyTurnstile };