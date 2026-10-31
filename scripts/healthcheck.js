'use strict';

const http = require('node:http');

const request = http.get({
  hostname: '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  path: '/health',
  timeout: 4000
}, response => {
  response.resume();
  process.exit(response.statusCode === 200 ? 0 : 1);
});

request.on('timeout', () => request.destroy(new Error('Health check timeout')));
request.on('error', () => process.exit(1));
