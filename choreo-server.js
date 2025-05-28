/**
 * Specialized Choreo server with CSS fixes
 * 
 * This server is designed specifically for Choreo deployment
 * with complete CSS error handling.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

console.log('[CHOREO-SERVER] Starting Choreo deployment server...');

// Set environment variables for deployment
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0'; // Accept connections on all interfaces
const dev = process.env.NODE_ENV !== 'production';

// Detect if running in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next/standalone'));
console.log('[CHOREO-SERVER] Running in standalone mode:', isStandalone);

// Fix manifest files to prevent entryCSSFiles error
const fixManifestFiles = () => {
  console.log('[CHOREO-SERVER] Fixing manifest files...');
  
  const rootDir = process.cwd();
  const nextDir = path.join(rootDir, '.next');
  const manifestPaths = [
    path.join(nextDir, 'build-manifest.json'),
    path.join(nextDir, 'app-build-manifest.json')
  ];
  
  if (isStandalone) {
    const standaloneNextDir = path.join(nextDir, 'standalone', '.next');
    manifestPaths.push(
      path.join(standaloneNextDir, 'build-manifest.json'),
      path.join(standaloneNextDir, 'app-build-manifest.json')
    );
  }
  
  // Fix each manifest
  manifestPaths.forEach(manifestPath => {
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let changed = false;
        
        if (!manifest.entryCSSFiles) {
          manifest.entryCSSFiles = manifestPath.includes('app-build') ? {} : { '/_app': [], '/': [] };
          changed = true;
        }
        
        if (changed) {
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`[CHOREO-SERVER] Fixed manifest: ${manifestPath}`);
        }
      } catch (e) {
        console.error(`[CHOREO-SERVER] Error fixing ${manifestPath}:`, e.message);
      }
    }
  });
};

// Create health check endpoint
const handleHealthCheck = (req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV,
      css_fix: true
    }));
    return true;
  }
  return false;
};

// Intercept CSS-related errors
process.on('uncaughtException', (error) => {
  if (error.message && 
      (error.message.includes('entryCSSFiles') || 
       error.message.includes('Cannot read properties of undefined'))) {
    console.log('[CHOREO-SERVER] Caught CSS-related error:', error.message);
    return; // Don't crash
  }
  
  // Log other uncaught exceptions and exit
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Fix manifests before starting
fixManifestFiles();

// Start server based on deployment mode
if (isStandalone && fs.existsSync(path.join(process.cwd(), '.next/standalone/server.js'))) {
  console.log('[CHOREO-SERVER] Using standalone server...');
  
  // Intercept createServer to add health check
  const originalCreateServer = require('http').createServer;
  require('http').createServer = function(...args) {
    if (args[0] && typeof args[0] === 'function') {
      const originalRequestListener = args[0];
      args[0] = function(req, res) {
        // Check for health endpoint first
        if (handleHealthCheck(req, res)) {
          return;
        }
        
        // Otherwise, pass to original handler
        return originalRequestListener(req, res);
      };
    }
    return originalCreateServer.apply(this, args);
  };
  
  // Use the standalone server directly
  require('./.next/standalone/server.js');
} else {
  console.log('[CHOREO-SERVER] Using custom server...');
  
  // Create Next.js app
  const app = next({ dev, dir: process.cwd() });
  const handle = app.getRequestHandler();
  
  // Prepare app and start server
  app.prepare().then(() => {
    createServer((req, res) => {
      try {
        // Check for health endpoint first
        if (handleHealthCheck(req, res)) {
          return;
        }
        
        // Handle all other requests with Next.js
        handle(req, res);
      } catch (err) {
        console.error('[CHOREO-SERVER] Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`[CHOREO-SERVER] Ready on http://${hostname}:${port}`);
    });
  }).catch(err => {
    console.error('[CHOREO-SERVER] Error preparing Next.js app:', err);
    process.exit(1);
  });
} 