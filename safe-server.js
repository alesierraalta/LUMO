/**
 * Safe Server for Next.js
 * 
 * Uses the safe-fix approach to handle entryCSSFiles errors
 * without modifying Object.prototype.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Environment configuration
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

console.log('[SAFE-SERVER] Starting server with safe entryCSSFiles handling...');

// Load the safe fix module
try {
  require('./ultimate-fix.js');
  console.log('[SAFE-SERVER] Loaded safe-fix module for entryCSSFiles protection');
} catch (e) {
  console.error('[SAFE-SERVER] Error loading safe-fix module:', e.message);
}

// Detect if we're in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next', 'standalone'));
console.log('[SAFE-SERVER] Running in standalone mode:', isStandalone);

// Add safe entryCSSFiles accessor
global.getEntryCSSFiles = (obj) => {
  if (!obj) return {};
  if (!obj.entryCSSFiles) obj.entryCSSFiles = {};
  return obj.entryCSSFiles;
};

// Start the appropriate server
const startSafeServer = async () => {
  try {
    if (isStandalone) {
      console.log('[SAFE-SERVER] Using standalone server with safe-fix protection...');
      
      // Make sure we have proper directories
      const standaloneNextDir = path.join(process.cwd(), '.next', 'standalone', '.next');
      if (!fs.existsSync(path.join(standaloneNextDir, 'static', 'css'))) {
        fs.mkdirSync(path.join(standaloneNextDir, 'static', 'css'), { recursive: true });
      }
      
      // Start the standalone server
      require('./.next/standalone/server.js');
    } else {
      // Create a custom server with the app
      console.log('[SAFE-SERVER] Starting custom server with safe-fix protection...');
      
      const app = next({ dev, dir: process.cwd() });
      const handle = app.getRequestHandler();
      
      await app.prepare();
      
      const server = createServer((req, res) => {
        try {
          handle(req, res);
        } catch (err) {
          console.error('[SAFE-SERVER] Error handling request:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
      
      server.listen(port, hostname, (err) => {
        if (err) throw err;
        console.log(`[SAFE-SERVER] Ready on http://${hostname}:${port}`);
      });
    }
  } catch (error) {
    console.error('[SAFE-SERVER] Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startSafeServer(); 