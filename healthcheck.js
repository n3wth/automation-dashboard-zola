#!/usr/bin/env node

/**
 * Health check script for Docker container
 * Verifies that the Next.js application is responding correctly
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 4000, // 4 second timeout (less than healthcheck timeout of 5s)
};

const req = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);

  if (res.statusCode === 200) {
    console.log('✓ Health check passed');
    process.exit(0);
  } else {
    console.error(`✗ Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error(`✗ Health check request failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('✗ Health check request timed out');
  req.destroy();
  process.exit(1);
});

req.setTimeout(4000);
req.end();