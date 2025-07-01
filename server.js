/**
 * ULTRA-OPTIMIZED CHOREO DEV SERVER
 * Minimal startup time, reduced logging, maximum performance
 */

// Silent mode - reduce console noise
const SILENT_MODE = process.env.CHOREO_SILENT === 'true';
const log = SILENT_MODE ? () => {} : console.log;

// Memory optimization for Choreo
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=6144 --optimize-for-size';
}

// Fast runtime patching - only if needed
try {
  require('./src/lib/runtime-module-patcher');
} catch (error) {
  // Silent fail - not critical for dev
}

const fs = require('fs');
const path = require('path');

// Quick environment setup
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '8080', 10);

log('🚀 LUMO Server Starting...');

// Fast build detection
const hasStandaloneServer = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));

if (!dev && hasStandaloneServer) {
  // Production mode - use standalone
  log('⚡ Standalone mode');
  
  const { createServer } = require('http');
  const NextServer = require('next/dist/server/next-server').default;
  
  const server = new NextServer({
    hostname,
    port,
    dir: __dirname,
    dev: false,
    conf: {}
  });
  
  const requestHandler = server.getRequestHandler();
  
  createServer(async (req, res) => {
    try {
      await requestHandler(req, res);
    } catch (err) {
      res.statusCode = 500;
      res.end('Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      startCustomServer();
    } else {
      log(`✅ Server: http://${hostname}:${port}`);
    }
  });
} else {
  // Development mode - optimized custom server
  startCustomServer();
}

function startCustomServer() {
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  // Ultra-fast Next.js setup
  const app = next({ 
    dev, 
    hostname, 
    port,
    quiet: true, // Reduce Next.js logging
    customServer: true
  });
  
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        await handle(req, res, parse(req.url, true));
      } catch (err) {
        res.statusCode = 500;
        res.end('Error');
      }
    }).listen(port, (err) => {
      if (err) process.exit(1);
      log(`✅ LUMO: http://${hostname}:${port}`);
      log('📊 Health: /api/health');
    });
  }).catch(() => process.exit(1));
}

// Minimal error handling
process.on('unhandledRejection', () => {});
process.on('uncaughtException', (error) => {
  console.error('❌ Fatal:', error.message);
  process.exit(1);
});
