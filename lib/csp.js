function buildCsp(nonce) {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const connectSrc = ["'self'"];
  const imgSrc = ["'self'", 'data:', 'blob:'];
  const frameSrc = ["'self'"];

  if (process.env.CSP_ALLOW_CLOUDFLARE === 'true') {
    connectSrc.push('https://challenges.cloudflare.com');
    scriptSrc.push('https://challenges.cloudflare.com');
    frameSrc.push('https://challenges.cloudflare.com');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join('; ');
}

module.exports = { buildCsp };