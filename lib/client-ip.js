'use strict';

const net = require('node:net');

/**
 * Resolve a client address for rate limiting and audit events.
 *
 * Only trust CF-Connecting-IP when the deployment explicitly declares that
 * requests arrive through Cloudflare. The application origin must remain
 * private behind the Cloudflare Tunnel; never enable this for a directly
 * reachable origin. Do not use X-Forwarded-For here: it can contain
 * client-supplied values and proxy-chain entries.
 */
function getClientIp(req) {
  const socketIp = req?.socket?.remoteAddress || '127.0.0.1';

  if (process.env.TRUST_PROXY !== 'cloudflare') {
    return socketIp;
  }

  const forwardedIp = req?.headers?.['cf-connecting-ip'];
  if (typeof forwardedIp !== 'string') {
    return socketIp;
  }

  const candidate = forwardedIp.trim();
  return net.isIP(candidate) ? candidate : socketIp;
}

module.exports = { getClientIp };
