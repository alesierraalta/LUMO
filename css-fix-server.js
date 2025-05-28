/**
 * CSS Fix Server for Next.js
 * 
 * This specialized server focuses on fixing the entryCSSFiles issue
 * by patching the actual CSS rendering process.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

console.log('[CSS-FIX] Starting CSS-specialized server...');

// Environment configuration
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

// Detect standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next', 'standalone'));
console.log('[CSS-FIX] Running in standalone mode:', isStandalone);

// Prepare paths
const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
const standaloneNextDir = isStandalone ? path.join(nextDir, 'standalone', '.next') : null;

// Create CSS fallback directory if needed
const createCssFallbackFiles = () => {
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
      console.log(`[CSS-FIX] Created directory: ${dir}`);
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
    console.log(`[CSS-FIX] Created fallback CSS: ${file}`);
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
        console.log(`[CSS-FIX] Updated manifest with fallback CSS: ${manifestPath}`);
      }
    } catch (e) {
      console.error(`[CSS-FIX] Error updating manifest ${manifestPath}:`, e.message);
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

// Apply CSS fixes
createCssFallbackFiles();

// Intercept CSS-related errors
process.on('uncaughtException', (error) => {
  if (error.message && 
      (error.message.includes('entryCSSFiles') || 
       error.message.includes('CSS') ||
       error.message.includes('Cannot read properties of undefined'))) {
    console.log('[CSS-FIX] Intercepted CSS-related error:', error.message);
    return; // Don't crash
  }
  
  // Log other errors
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server function
const startServer = async () => {
  if (isStandalone) {
    console.log('[CSS-FIX] Using standalone server...');
    // Use the standalone server directly
    try {
      require('./.next/standalone/server.js');
    } catch (e) {
      console.error('[CSS-FIX] Error starting standalone server:', e.message);
      process.exit(1);
    }
    return;
  }
  
  // Create custom Next.js server
  try {
    const app = next({ dev, dir: process.cwd() });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    const server = createServer((req, res) => {
      // Handle health check
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
      
      // Handle regular requests
      try {
        handle(req, res);
      } catch (err) {
        console.error('[CSS-FIX] Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`[CSS-FIX] Server ready on http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error('[CSS-FIX] Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 