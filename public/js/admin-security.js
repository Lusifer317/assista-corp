(() => {
  const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
  const originalFetch = window.fetch.bind(window);

  function csrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)assista_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  window.fetch = (input, init = {}) => {
    const request = input instanceof Request ? input : null;
    const url = request ? request.url : String(input);
    const method = String(init.method || request?.method || 'GET').toUpperCase();
    const sameOrigin = new URL(url, window.location.href).origin === window.location.origin;

    if (!sameOrigin || SAFE.has(method)) return originalFetch(input, init);

    const headers = new Headers(request?.headers || init.headers || {});
    const token = csrfToken();
    if (token) headers.set('X-CSRF-Token', token);

    return originalFetch(input, { ...init, headers });
  };
})();
