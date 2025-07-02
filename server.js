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

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Detect actual environment from Choreo
const choreoEnv = process.env.CHOREO_ENVIRONMENT; // 'Development' or 'Production'
const nodeEnv = process.env.NODE_ENV;

// Build artifacts detection (for optimizations, not environment forcing)
const hasStandaloneServer = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID')) ||
                           fs.existsSync(path.join(__dirname, '.next', 'server.js')) ||
                           fs.existsSync(path.join(__dirname, '.next', 'standalone'));

// Determine if we should run in dev mode - respect Choreo environment
const dev = nodeEnv !== 'production' && choreoEnv !== 'Production';

// Only force production if explicitly in Choreo Production environment
if (choreoEnv === 'Production' && nodeEnv !== 'production') {
  process.env.NODE_ENV = 'production';
}

const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Starting server: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(`🌍 Choreo Environment: ${choreoEnv || 'Not set'}`);
console.log(`📦 BUILD_ID exists: ${hasStandaloneServer}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🌐 Server will run on: http://${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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
