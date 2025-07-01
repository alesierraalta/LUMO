#!/usr/bin/env node

// Ultra-minimal production server
// Force production mode and disable telemetry
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Check if standalone build exists
const fs = require('fs');
const path = require('path');

if (fs.existsSync('./.next/BUILD_ID')) {
  // Use Next.js generated standalone server
  console.log('🚀 Starting standalone server...');
  require('./.next/standalone/server.js');
} else {
  // Fallback to custom server
  const { createServer } = require('http');
  const next = require('next');
  
  const app = next({ dev: false });
  const handle = app.getRequestHandler();
  
  app.prepare().then(() => {
    createServer((req, res) => handle(req, res))
      .listen(8080, () => console.log('✅ Server ready on port 8080'));
  });
}
