/**
 * ASSISTA CORP — Consent-gated first-party analytics.
 * No analytics identifier or telemetry is created before explicit opt-in.
 */
(function () {
  const SESSION_KEY = 'assista_session_id';
  const CONSENT_KEY = 'assista_consent_choice';

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch {}
  }

  let consentStatus = storageGet(CONSENT_KEY) || 'pending';
  if (!['pending', 'granted', 'rejected'].includes(consentStatus)) consentStatus = 'pending';
  let sessionId = consentStatus === 'granted' ? storageGet(SESSION_KEY) : null;
  let initialized = false;

  function createSessionId() {
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return 'ses_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function getRegionFromTimezone() {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timezone) return 'Global';
      const parts = timezone.split('/');
      return parts.length > 1 ? parts[1].replace(/_/g, ' ') + ', ' + parts[0] : timezone;
    } catch {
      return 'Global';
    }
  }

  async function postJSON(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function recordEvent(eventType, eventData) {
    if (consentStatus !== 'granted' || !sessionId) return;
    postJSON('/api/analytics/track', { sessionId, eventType, eventData: eventData || {} });
  }

  async function initializeSession() {
    if (initialized || consentStatus !== 'granted') return;
    if (!sessionId) {
      sessionId = createSessionId();
      storageSet(SESSION_KEY, sessionId);
    }
    initialized = true;
    const created = await postJSON('/api/analytics/session', {
      sessionId,
      referrer: document.referrer || 'Direct / Bookmark',
      region: getRegionFromTimezone(),
      consentStatus: 'granted'
    });
    if (!created) {
      initialized = false;
      return;
    }
    recordEvent('page_view', { path: window.location.pathname, title: document.title });
    window.addEventListener('hashchange', () => {
      recordEvent('page_view', { path: window.location.pathname, title: document.title });
    });
    [30, 60, 180, 300].forEach(seconds => {
      window.setTimeout(() => recordEvent('dwell_milestone', { duration: seconds }), seconds * 1000);
    });
  }

  function setConsent(status) {
    if (!['granted', 'rejected'].includes(status)) return;
    const previousSession = sessionId;
    consentStatus = status;
    storageSet(CONSENT_KEY, status);
    if (status === 'granted') {
      initializeSession();
      return;
    }
    if (previousSession) postJSON('/api/analytics/consent', { sessionId: previousSession, consentStatus: 'rejected' });
    sessionId = null;
    initialized = false;
    storageRemove(SESSION_KEY);
  }

  window.AssistaAnalytics = {
    recordEvent,
    setConsent,
    getConsent: () => consentStatus,
    getSessionId: () => consentStatus === 'granted' ? sessionId : null
  };

  if (consentStatus === 'granted') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSession, { once: true });
    else initializeSession();
  }
})();