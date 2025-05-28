/**
 * Production Server for Next.js
 * 
 * This server script includes production-optimized fixes for the entryCSSFiles issue
 * while maintaining compatibility with Choreo deployment.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

// Load all protection scripts
try {
  require('./runtime-protection.js');
  require('./react-protection.js');
} catch (e) {
  console.log('[PRODUCTION-SERVER] Protection scripts loaded with warnings:', e.message);
}

console.log('[PRODUCTION-SERVER] Starting production server with entryCSSFiles protection...');

// Detect if we're in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next', 'standalone'));
console.log('[PRODUCTION-SERVER] Running in standalone mode:', isStandalone);

// Fix manifest files for entryCSSFiles issue
const fixManifestFiles = () => {
  try {
    const nextDir = path.join(process.cwd(), '.next');
    const manifestPaths = [
      path.join(nextDir, 'build-manifest.json'),
      path.join(nextDir, 'app-build-manifest.json')
    ];
    
    if (isStandalone) {
      manifestPaths.push(
        path.join(nextDir, 'standalone', '.next', 'build-manifest.json'),
        path.join(nextDir, 'standalone', '.next', 'app-build-manifest.json')
      );
    }
    
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
            console.log(`[PRODUCTION-SERVER] Fixed manifest: ${manifestPath}`);
          }
        } catch (e) {
          console.error(`[PRODUCTION-SERVER] Error fixing ${manifestPath}:`, e.message);
        }
      }
    });
  } catch (e) {
    console.error('[PRODUCTION-SERVER] Error fixing manifest files:', e.message);
  }
};

// Handle missing entryCSSFiles
process.on('uncaughtException', (error) => {
  if (error.message && 
      (error.message.includes('entryCSSFiles') || 
       error.message.includes('Cannot read properties of undefined'))) {
    console.log('[PRODUCTION-SERVER] Caught entryCSSFiles error - continuing execution');
    return; // Don't crash
  }
  
  // Log other uncaught exceptions and exit
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Fix missing entryCSSFiles on demand
const addEntryCSSFilesToManifest = (manifest) => {
  if (!manifest) return manifest;
  
  if (!manifest.entryCSSFiles) {
    manifest.entryCSSFiles = {};
    // Add common pages
    if (manifest.pages) {
      Object.keys(manifest.pages).forEach(page => {
        manifest.entryCSSFiles[page] = [];
      });
    }
  }
  
  return manifest;
};

// Apply safe JSON parser that fixes manifests
const originalJSONParse = JSON.parse;
JSON.parse = function(text, reviver) {
  const result = originalJSONParse.call(this, text, reviver);
  
  // Check if this looks like a manifest
  if (result && 
      typeof result === 'object' && 
      (result.pages || result.polyfillFiles)) {
    return addEntryCSSFilesToManifest(result);
  }
  
  return result;
};

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0';

console.log('[PRODUCTION-SERVER] Environment: production');
console.log('[PRODUCTION-SERVER] Port:', port);
console.log('[PRODUCTION-SERVER] Working directory:', process.cwd());

// Function to serve a basic HTML fallback
function serveHTMLFallback(res, title = 'Inventory App', message = 'Loading...') {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 90%;
          }
          .logo { font-size: 3em; margin-bottom: 20px; }
          h1 { margin-bottom: 20px; font-weight: 300; }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .message { margin: 20px 0; font-size: 1.1em; }
          .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: background 0.3s;
          }
          .btn:hover { background: rgba(255, 255, 255, 0.3); }
          .status { font-size: 0.9em; opacity: 0.8; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📦</div>
          <h1>Inventory Management System</h1>
          <div class="spinner"></div>
          <div class="message">${message}</div>
          <button class="btn" onclick="window.location.reload()">Refresh</button>
          <button class="btn" onclick="checkStatus()">Check Status</button>
          <div class="status">Server is running • ${new Date().toLocaleTimeString()}</div>
        </div>
        <script>
          let retryCount = 0;
          const maxRetries = 10;
          
          function checkStatus() {
            fetch(window.location.href)
              .then(response => {
                if (response.ok) {
                  window.location.reload();
                } else {
                  console.log('Server responded with status:', response.status);
                }
              })
              .catch(error => {
                console.log('Connection check failed:', error);
              });
          }
          
          function autoRetry() {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log('Auto-retry attempt:', retryCount);
              setTimeout(() => {
                window.location.reload();
              }, 3000 + (retryCount * 1000));
            }
          }
          
          // Start auto-retry
          autoRetry();
        </script>
      </body>
    </html>
  `;
  
  res.end(html);
}

// Function to serve static files with better error handling
function serveStaticFile(req, res, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return false;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.log('[PRODUCTION-SERVER] Stream error:', error.message);
      if (!res.headersSent) {
        res.statusCode = 404;
        res.end('File not found');
      }
    });
    
    return true;
  } catch (error) {
    console.log('[PRODUCTION-SERVER] Error serving static file:', error.message);
    return false;
  }
}

// Run fixes before starting server
fixManifestFiles();

// Create Next.js app
const app = next({ dev, hostname, port, dir: process.cwd() });
const handle = app.getRequestHandler();

// Start the server
const startProductionServer = async () => {
  try {
    await app.prepare();
    
    createServer((req, res) => {
      try {
        handle(req, res);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`[PRODUCTION-SERVER] Ready on http://${hostname}:${port}`);
    });
  } catch (e) {
    console.error('[PRODUCTION-SERVER] Error starting server:', e);
    process.exit(1);
  }
};

// Start server
if (isStandalone && fs.existsSync(path.join(process.cwd(), '.next', 'standalone', 'server.js'))) {
  console.log('[PRODUCTION-SERVER] Using standalone server...');
  require('./.next/standalone/server.js');
} else {
  console.log('[PRODUCTION-SERVER] Using custom server...');
  startProductionServer();
} 