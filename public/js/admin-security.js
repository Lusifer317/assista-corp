(() => {
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
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

    if (!sameOrigin || SAFE_METHODS.has(method)) return originalFetch(input, init);

    const headers = new Headers(request?.headers || init.headers || {});
    const token = csrfToken();
    if (token) headers.set('X-CSRF-Token', token);

    return originalFetch(input, { ...init, headers });
  };

  // The legacy admin controller uses innerHTML for a number of dynamic views.
  // Sanitize those assignments at the DOM boundary so attacker-controlled lead,
  // note, attribution, analytics, and audit data cannot create executable HTML.
  const nativeInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (!nativeInnerHTML?.set || !nativeInnerHTML?.get) return;

  const SAFE_URI_SCHEMES = /^(?:https?:|mailto:|tel:|\/|#|data:image\/(?:png|gif|jpe?g|webp);base64,)/i;
  const BLOCKED_ELEMENTS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'style', 'template']);

  function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html);

    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (const element of nodes) {
      if (BLOCKED_ELEMENTS.has(element.tagName.toLowerCase())) {
        element.remove();
        continue;
      }

      for (const attr of [...element.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();

        if (name.startsWith('on') || name === 'srcdoc') {
          element.removeAttribute(attr.name);
          continue;
        }

        if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action' || name === 'formaction') && value && !SAFE_URI_SCHEMES.test(value)) {
          element.removeAttribute(attr.name);
        }
      }
    }

    return template.innerHTML;
  }

  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: nativeInnerHTML.configurable,
    enumerable: nativeInnerHTML.enumerable,
    get: nativeInnerHTML.get,
    set(value) {
      nativeInnerHTML.set.call(this, sanitizeHtml(value));
    }
  });
})();
