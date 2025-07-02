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

// Enhanced production detection for Choreo
const hasStandaloneServer = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID')) ||
                           fs.existsSync(path.join(__dirname, '.next', 'server.js')) ||
                           fs.existsSync(path.join(__dirname, '.next', 'standalone'));

const dev = !hasStandaloneServer && process.env.NODE_ENV !== 'production';
const isProd = !dev || hasStandaloneServer || process.env.NODE_ENV === 'production';

// Force production mode if build artifacts exist
if (hasStandaloneServer) {
  process.env.NODE_ENV = 'production';
}

const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Starting server: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
console.log(`📦 BUILD_ID exists: ${hasStandaloneServer}`);
console.log(`🌐 Server will run on: http://${hostname}:${port}`);

const app = require('next')({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const { createServer } = require('http');
  const { parse } = require('url');

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Ready on http://${hostname}:${port}`);
    });
});

// Minimal error handling
process.on('unhandledRejection', () => {});
process.on('uncaughtException', (error) => {
  console.error('❌ Fatal:', error.message);
  process.exit(1);
});
