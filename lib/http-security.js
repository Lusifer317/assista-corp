const http = require('node:http');

let installed = false;

function installHttpSecurity() {
  if (installed) return;
  installed = true;

  const originalSetHeader = http.ServerResponse.prototype.setHeader;

  http.ServerResponse.prototype.setHeader = function setHeader(name, value) {
    if (String(name).toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value : [value];
      value = cookies.map(cookie => {
        if (typeof cookie !== 'string' || !cookie.startsWith('assista_session=')) return cookie;

        const deleteCookie = /(?:^|;)\s*Max-Age=0(?:;|$)/i.test(cookie);
        let normalized = cookie
          .replace(/;\s*Max-Age=\d+/i, '')
          .replace(/;\s*Secure/i, '')
          .replace(/;\s*HttpOnly/i, '')
          .replace(/;\s*SameSite=[^;]+/i, '')
          .replace(/;\s*Path=[^;]+/i, '');

        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const maxAge = deleteCookie
          ? 0
          : Math.max(0, Math.floor(Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000) / 1000));

        return `${normalized}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
      });
    }

    return originalSetHeader.call(this, name, value);
  };
}

module.exports = { installHttpSecurity };
