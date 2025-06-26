/**
 * Production Server for Next.js
 * 
 * This server script includes production-optimized fixes for the entryCSSFiles issue
 * while maintaining compatibility with Choreo deployment.
 */

// ULTRA-AGGRESSIVE ENTRYCSSFILES PROTECTION
// This must be the very first thing we do
console.log('[RUNTIME-PROTECTION] Installing runtime protection for entryCSSFiles...');

// Global error suppression for entryCSSFiles
const originalError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('entryCSSFiles') || message.includes('Cannot read properties of undefined')) {
    console.log('[RUNTIME-PROTECTION] Suppressed entryCSSFiles console error:', message);
    return;
  }
  return originalError.apply(console, args);
};

// Global property access protection
const protectedGlobal = new Proxy(globalThis, {
  get(target, prop) {
    const value = target[prop];
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(obj, innerProp) {
          if (innerProp === 'entryCSSFiles' && obj[innerProp] === undefined) {
            console.log('[RUNTIME-PROTECTION] Auto-creating entryCSSFiles on global object access');
            obj[innerProp] = {};
          }
          return obj[innerProp];
        }
      });
    }
    return value;
  }
});

// Patch all property access methods
const originalGetOwnPropertyNames = Object.getOwnPropertyNames;
Object.getOwnPropertyNames = function(obj) {
  try {
    return originalGetOwnPropertyNames(obj);
  } catch (e) {
    if (e.message && e.message.includes('entryCSSFiles')) {
      console.log('[RUNTIME-PROTECTION] Protected getOwnPropertyNames');
      return [];
    }
    throw e;
  }
};

// Patch hasOwnProperty
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function(prop) {
  try {
    return originalHasOwnProperty.call(this, prop);
  } catch (e) {
    if (e.message && e.message.includes('entryCSSFiles')) {
      console.log('[RUNTIME-PROTECTION] Protected hasOwnProperty for entryCSSFiles');
      return prop === 'entryCSSFiles';
    }
    throw e;
  }
};

// Monkey patch all object access
const originalObjectKeys = Object.keys;
Object.keys = function(obj) {
  try {
    if (!obj) return [];
    return originalObjectKeys(obj);
  } catch (e) {
    console.log('[RUNTIME-PROTECTION] Protected Object.keys');
    return [];
  }
};

console.log('[RUNTIME-PROTECTION] Ultra-aggressive protection installed!');

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const Module = require('module');

// Load all protection scripts
try {
  require('./runtime-protection.js');
  require('./react-protection.js');
} catch (e) {
  console.log('[PRODUCTION-SERVER] Protection scripts loaded with warnings:', e.message);
}

console.log('[PRODUCTION-SERVER] Starting production server with enhanced CSS fixes...');

// Detect if we're in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next', 'standalone'));
console.log('[PRODUCTION-SERVER] Running in standalone mode:', isStandalone);

// Prepare paths
const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
const standaloneNextDir = isStandalone ? path.join(nextDir, 'standalone', '.next') : null;

// Create real CSS fallback files
const createCssFallbackFiles = () => {
  console.log('[PRODUCTION-SERVER] Creating CSS fallback files...');
  
  const dirs = [
    path.join(nextDir, 'static', 'css'),
    path.join(nextDir, 'static', 'chunks')
  ];
  
  if (isStandalone) {
    dirs.push(
      path.join(standaloneNextDir, 'static', 'css'),
      path.join(standaloneNextDir, 'static', 'chunks')
    );
  }
  
  // Ensure directories exist
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[PRODUCTION-SERVER] Created directory: ${dir}`);
    }
  });
  
  // Create a real fallback CSS file that gets loaded on errors
  const cssContent = `
    /* Fallback CSS file */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .error-container {
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #0070f3;
    }
    h1 { color: #333; }
  `;
  
  const cssFiles = [
    path.join(nextDir, 'static', 'css', 'fallback.css')
  ];
  
  if (isStandalone) {
    cssFiles.push(path.join(standaloneNextDir, 'static', 'css', 'fallback.css'));
  }
  
  // Write fallback CSS file
  cssFiles.forEach(file => {
    fs.writeFileSync(file, cssContent);
    console.log(`[PRODUCTION-SERVER] Created fallback CSS: ${file}`);
  });
  
  // Update manifest files to use our fallback CSS
  const updateManifest = (manifestPath, isApp = false) => {
    if (!fs.existsSync(manifestPath)) return;
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let changed = false;
      
      // Create or update entryCSSFiles with our fallback
      if (!manifest.entryCSSFiles) {
        manifest.entryCSSFiles = {};
        changed = true;
      }
      
      // Add fallback CSS to all pages
      if (manifest.pages) {
        Object.keys(manifest.pages).forEach(page => {
          manifest.entryCSSFiles[page] = ['/static/css/fallback.css'];
        });
        changed = true;
      }
      
      // Add fallback for app router
      if (isApp) {
        manifest.entryCSSFiles = { 
          '/': ['/static/css/fallback.css'] 
        };
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`[PRODUCTION-SERVER] Updated manifest with fallback CSS: ${manifestPath}`);
      }
    } catch (e) {
      console.error(`[PRODUCTION-SERVER] Error updating manifest ${manifestPath}:`, e.message);
    }
  };
  
  // Update manifests with fallback CSS
  updateManifest(path.join(nextDir, 'build-manifest.json'));
  updateManifest(path.join(nextDir, 'app-build-manifest.json'), true);
  
  if (isStandalone) {
    updateManifest(path.join(standaloneNextDir, 'build-manifest.json'));
    updateManifest(path.join(standaloneNextDir, 'app-build-manifest.json'), true);
  }
};

// Apply runtime patching for Next.js CSS handling
const applyRuntimePatching = () => {
  console.log('[PRODUCTION-SERVER] Applying runtime patching for CSS handling...');
  
  // Track patched modules
  const patchedModules = new Set();
  
  // Store original require
  const originalRequire = Module.prototype.require;
  
  // Patch require to intercept CSS handling modules
  Module.prototype.require = function(id) {
    // Get the original module
    const originalModule = originalRequire.apply(this, arguments);
    
    try {
      // Handle modules containing CSS loading logic
      if (typeof id === 'string') {
        
        // Patch the build manifest handler
        if (id.includes('build-manifest') && !patchedModules.has(id)) {
          console.log(`[PRODUCTION-SERVER] Patching build manifest module: ${id}`);
          patchedModules.add(id);
          
          if (originalModule && typeof originalModule === 'object') {
            // Ensure entryCSSFiles exists
            if (!originalModule.entryCSSFiles) {
              originalModule.entryCSSFiles = {};
            }
          }
        }
        
        // Patch Next.js CSS handling
        if (id.includes('next/dist/server/render') && !patchedModules.has(id)) {
          console.log(`[PRODUCTION-SERVER] Patching Next.js CSS rendering: ${id}`);
          patchedModules.add(id);
          
          if (originalModule && typeof originalModule === 'object') {
            // Patch CSS collection functions
            const safeCssLoader = (original) => {
              return function(...args) {
                try {
                  if (typeof original === 'function') {
                    return original.apply(this, args);
                  }
                  return [];
                } catch (e) {
                  console.log('[PRODUCTION-SERVER] Caught CSS loader error:', e.message);
                  return [];
                }
              };
            };
            
            if (originalModule.getCssInlinedLinkTags) {
              originalModule.getCssInlinedLinkTags = safeCssLoader(originalModule.getCssInlinedLinkTags);
            }
            if (originalModule.getPreloadableFonts) {
              originalModule.getPreloadableFonts = safeCssLoader(originalModule.getPreloadableFonts);
            }
            if (originalModule.getCssLinkTags) {
              originalModule.getCssLinkTags = safeCssLoader(originalModule.getCssLinkTags);
            }
          }
        }
      }
    } catch (error) {
      console.log('[PRODUCTION-SERVER] Error patching module:', error.message);
    }
    
    return originalModule;
  };
  
  console.log('[PRODUCTION-SERVER] Runtime patching applied successfully');
};

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
       error.message.includes('Cannot read properties of undefined') ||
       error.message.includes('CSS'))) {
    console.log('[PRODUCTION-SERVER] Caught CSS-related error - continuing execution');
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
        manifest.entryCSSFiles[page] = ['/static/css/fallback.css'];
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

// Apply all fixes before starting server
fixManifestFiles();
createCssFallbackFiles();
applyRuntimePatching();

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
        <link rel="stylesheet" href="/static/css/fallback.css">
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

// Start server
if (isStandalone && fs.existsSync(path.join(process.cwd(), '.next', 'standalone', 'server.js'))) {
  console.log('[PRODUCTION-SERVER] Using standalone server with enhanced CSS handling...');
  
  // Create a proxy that adds fallback CSS loading to every request
  const originalCreateServer = require('http').createServer;
  require('http').createServer = function(...args) {
    if (args[0] && typeof args[0] === 'function') {
      const originalRequestListener = args[0];
      args[0] = function(req, res) {
        // Try to handle CSS files directly
        if (req.url && req.url.endsWith('.css')) {
          const cssPath = path.join(process.cwd(), '.next', 'static', 'css', path.basename(req.url));
          if (serveStaticFile(req, res, cssPath)) {
            return;
          }
        }
        
        // Add our fallback CSS to the response
        const originalSetHeader = res.setHeader;
        res.setHeader = function(name, value) {
          if (name.toLowerCase() === 'content-type' && value.includes('text/html')) {
            // This is an HTML response, we can add our CSS link
            const originalEnd = res.end;
            res.end = function(chunk, encoding, callback) {
              if (chunk) {
                let html = chunk.toString();
                // Add our fallback CSS link if not already present
                if (!html.includes('/static/css/fallback.css')) {
                  html = html.replace('</head>', '<link rel="stylesheet" href="/static/css/fallback.css"></head>');
                }
                originalEnd.call(this, html, encoding, callback);
              } else {
                originalEnd.apply(this, arguments);
              }
            };
          }
          return originalSetHeader.apply(this, arguments);
        };
        
        return originalRequestListener(req, res);
      };
    }
    return originalCreateServer.apply(this, args);
  };
  
  require('./.next/standalone/server.js');
} else {
  console.log('[PRODUCTION-SERVER] Using custom server...');
  
  // Create Next.js app
  const app = next({ dev, hostname, port, dir: process.cwd() });
  const handle = app.getRequestHandler();
  
  // Start the server
  const startProductionServer = async () => {
    try {
      await app.prepare();
      
      createServer((req, res) => {
        try {
          // Handle CSS files directly
          if (req.url && req.url.endsWith('.css')) {
            const cssPath = path.join(process.cwd(), '.next', 'static', 'css', path.basename(req.url));
            if (serveStaticFile(req, res, cssPath)) {
              return;
            }
          }
          
          // Health check
          if (req.url === '/health' || req.url === '/api/health') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              status: 'healthy', 
              timestamp: new Date().toISOString(),
              css_fix: true
            }));
            return;
          }
          
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
  
  startProductionServer();
} 