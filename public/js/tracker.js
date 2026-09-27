/**
 * ASSISTA CORP — Privacy-Conscious First-Party Intelligence
 * No third-party pixels. No invasive fingerprinting. Zero PII collected anonymously.
 */

(function () {
  const SESSION_KEY = 'assista_session_id';
  const CONSENT_KEY = 'assista_consent_choice';

  function getOrGenerateSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  const sessionId = getOrGenerateSessionId();
  let consentStatus = localStorage.getItem(CONSENT_KEY) || 'pending';

  function getRegionFromTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return 'Global';
      const parts = tz.split('/');
      return parts.length > 1 ? `${parts[1].replace(/_/g, ' ')}, ${parts[0]}` : tz;
    } catch (e) {
      return 'Global';
    }
  }

  async function postJSON(endpoint, data) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      });
    } catch (err) {
      // Non-blocking telemetry
    }
  }

  function initSession() {
    postJSON('/api/analytics/session', {
      sessionId,
      referrer: document.referrer || 'Direct / Bookmark',
      region: getRegionFromTimezone(),
      consentStatus
    });

    // Record initial pageview
    recordEvent('page_view', {
      path: window.location.pathname + window.location.hash,
      title: document.title
    });
  }

  function recordEvent(eventType, eventData = {}) {
    // If user explicitly rejected analytics, only record strictly necessary form submissions
    if (consentStatus === 'rejected' && eventType !== 'form_submitted') {
      return;
    }

    postJSON('/api/analytics/track', {
      sessionId,
      eventType,
      eventData
    });
  }

  function setConsent(status) {
    consentStatus = status;
    localStorage.setItem(CONSENT_KEY, status);
    postJSON('/api/analytics/consent', {
      sessionId,
      consentStatus: status
    });
  }

  // Track hash changes (e.g. #capabilities, #industries, #team-builder)
  window.addEventListener('hashchange', () => {
    recordEvent('page_view', {
      path: window.location.pathname + window.location.hash,
      title: document.title
    });
  });

  // Track dwell time milestones
  [30, 60, 180, 300].forEach(seconds => {
    setTimeout(() => {
      recordEvent('dwell_milestone', { duration: seconds });
    }, seconds * 1000);
  });

  // Expose to window for UI interactions
  window.AssistaAnalytics = {
    sessionId,
    recordEvent,
    setConsent,
    getConsent: () => consentStatus
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }
})();
