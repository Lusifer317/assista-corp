'use strict';

const assert = require('node:assert/strict');
const { getClientIp } = require('../lib/client-ip');

function runClientIpTests() {
  const previous = process.env.TRUST_PROXY;
  const req = {
    socket: { remoteAddress: '172.20.0.5' },
    headers: {
      'cf-connecting-ip': '203.0.113.42',
      'x-forwarded-for': '198.51.100.99, 172.20.0.5'
    }
  };

  try {
    delete process.env.TRUST_PROXY;
    assert.equal(getClientIp(req), '172.20.0.5',
      'untrusted forwarding headers must be ignored');

    process.env.TRUST_PROXY = 'cloudflare';
    assert.equal(getClientIp(req), '203.0.113.42',
      'trusted Cloudflare CF-Connecting-IP must be used');
    assert.equal(getClientIp({
      socket: { remoteAddress: '172.20.0.5' },
      headers: { 'cf-connecting-ip': 'not-an-ip', 'x-forwarded-for': '198.51.100.99' }
    }), '172.20.0.5', 'invalid Cloudflare address must fall back to socket address');
    assert.equal(getClientIp({
      socket: { remoteAddress: '172.20.0.5' },
      headers: { 'cf-connecting-ip': ['203.0.113.42'] }
    }), '172.20.0.5', 'non-string Cloudflare address must be rejected');
  } finally {
    if (previous === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previous;
  }

  console.log('Client IP trust tests passed.');
}

if (require.main === module) runClientIpTests();
module.exports = { runClientIpTests };
