const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

// Load runtime protection for entryCSSFiles errors
try {
  require('./runtime-protection.js');
} catch (e) {
  console.log('[CHOREO-SERVER] Runtime protection not found, continuing without it');
}

// Load React-specific protection
try {
  require('./react-protection.js');
} catch (e) {
  console.log('[CHOREO-SERVER] React protection not found, continuing without it');
}

console.log('[CHOREO-SERVER] Starting Next.js application for Choreo deployment...');

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 8080;
const hostname = '0.0.0.0';

console.log('[CHOREO-SERVER] Environment:', process.env.NODE_ENV);
console.log('[CHOREO-SERVER] Port:', port);
console.log('[CHOREO-SERVER] Working directory:', process.cwd());

// Function to ensure all required directories and files exist
function ensureDeploymentStructure() {
  const baseDir = process.cwd();
  
  // Check for standalone build
  const standaloneDir = path.join(baseDir, '.next/standalone');
  const isStandalone = fs.existsSync(standaloneDir);
  
  console.log('[CHOREO-SERVER] Standalone mode detected:', isStandalone);
  
  if (isStandalone) {
    // Ensure static files are in the correct location
    const staticSrc = path.join(baseDir, '.next/static');
    const staticDest = path.join(standaloneDir, '.next/static');
    
    if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
      console.log('[CHOREO-SERVER] Copying static files for standalone deployment...');
      try {
        copyDirectoryRecursive(staticSrc, staticDest);
        console.log('[CHOREO-SERVER] Static files copied successfully');
      } catch (error) {
        console.log('[CHOREO-SERVER] Error copying static files:', error.message);
      }
    }
    
    // Ensure public files are available
    const publicSrc = path.join(baseDir, 'public');
    const publicDest = path.join(standaloneDir, 'public');
    
    if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
      console.log('[CHOREO-SERVER] Copying public files for standalone deployment...');
      try {
        copyDirectoryRecursive(publicSrc, publicDest);
        console.log('[CHOREO-SERVER] Public files copied successfully');
      } catch (error) {
        console.log('[CHOREO-SERVER] Error copying public files:', error.message);
      }
    }
    
    return standaloneDir;
  }
  
  return null;
}

// Helper function to copy directories recursively
function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to serve static files
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
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    
    // Set caching headers for static assets
    if (req.url.includes('/_next/static/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.log('[CHOREO-SERVER] Stream error:', error.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    return true;
  } catch (error) {
    console.log('[CHOREO-SERVER] Error serving static file:', error.message);
    return false;
  }
}

// Main server function
function startServer() {
  console.log('[CHOREO-SERVER] Initializing server...');
  
  // Check deployment structure
  const standaloneDir = ensureDeploymentStructure();
  
  if (standaloneDir) {
    // Try to use standalone server first
    const standaloneServerPath = path.join(standaloneDir, 'server.js');
    
    if (fs.existsSync(standaloneServerPath)) {
      console.log('[CHOREO-SERVER] Using standalone server...');
      
      try {
        // Change to standalone directory
        const originalCwd = process.cwd();
        process.chdir(standaloneDir);
        
        // Set environment variables for standalone mode
        process.env.HOSTNAME = hostname;
        process.env.PORT = String(port);
        
        // Require the standalone server
        require('./server.js');
        console.log('[CHOREO-SERVER] Standalone server started successfully');
        return;
      } catch (error) {
        console.log('[CHOREO-SERVER] Standalone server failed:', error.message);
        
        // Reset working directory
        try {
          process.chdir(originalCwd);
        } catch (e) {
          // Ignore chdir errors
        }
      }
    }
  }
  
  // Fallback to custom Next.js server
  console.log('[CHOREO-SERVER] Using custom Next.js server...');
  
  const app = next({ dev, dir: process.cwd() });
  const handle = app.getRequestHandler();
  
  app.prepare().then(() => {
    console.log('[CHOREO-SERVER] Next.js app prepared successfully');
    
    const server = createServer(async (req, res) => {
      // Set a timeout to ensure responses don't hang
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.log('[CHOREO-SERVER] Request timeout, sending error response');
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Request Timeout</title></head>
              <body>
                <h1>Request Timeout</h1>
                <p>The server took too long to respond.</p>
              </body>
            </html>
          `);
        }
      }, 30000); // 30 second timeout
      
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        console.log(`[CHOREO-SERVER] Handling request: ${req.method} ${pathname}`);
        
        // Handle static files
        if (pathname.startsWith('/_next/static/')) {
          const staticPath = path.join(process.cwd(), '.next', pathname.replace('/_next/', ''));
          
          if (serveStaticFile(req, res, staticPath)) {
            clearTimeout(timeout);
            return;
          }
        }
        
        // Handle public files
        if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
          const publicPath = path.join(process.cwd(), 'public', pathname === '/' ? 'index.html' : pathname);
          
          if (serveStaticFile(req, res, publicPath)) {
            clearTimeout(timeout);
            return;
          }
        }
        
        // Enhanced error handling for Next.js requests
        try {
          await handle(req, res, parsedUrl);
          clearTimeout(timeout);
        } catch (nextError) {
          clearTimeout(timeout);
          console.error('[CHOREO-SERVER] Next.js handler error:', nextError.message);
          
          if (!res.headersSent) {
            // Try to send a basic HTML response
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Inventory App</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .error { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Inventory Management System</h1>
                    <div class="error">
                      <h3>Application is starting up...</h3>
                      <p>The application is initializing. Please try refreshing the page in a moment.</p>
                      <p><strong>Status:</strong> Server is running but application components are still loading.</p>
                      <button onclick="window.location.reload()">Refresh Page</button>
                    </div>
                  </div>
                  <script>
                    // Auto-refresh after 3 seconds
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  </script>
                </body>
              </html>
            `);
          }
        }
        
      } catch (error) {
        clearTimeout(timeout);
        console.error('[CHOREO-SERVER] Request handling error:', error.message);
        
        if (!res.headersSent) {
          res.statusCode = 200; // Send 200 instead of 500 to avoid browser errors
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Inventory App - Loading</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                  .loading { background: #e3f2fd; border: 1px solid #2196f3; padding: 40px; border-radius: 10px; }
                  .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #2196f3; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
              </head>
              <body>
                <div class="loading">
                  <h1>🏢 Inventory Management System</h1>
                  <div class="spinner"></div>
                  <h3>Application is loading...</h3>
                  <p>Please wait while the system initializes.</p>
                  <p><small>If this takes too long, please contact support.</small></p>
                </div>
                <script>
                  setTimeout(() => {
                    window.location.reload();
                  }, 5000);
                </script>
              </body>
            </html>
          `);
        }
      }
    });
    
    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('[CHOREO-SERVER] Server startup error:', err);
        process.exit(1);
      }
      
      console.log(`[CHOREO-SERVER] ✅ Server ready on http://${hostname}:${port}`);
      console.log(`[CHOREO-SERVER] Environment: ${process.env.NODE_ENV}`);
      console.log(`[CHOREO-SERVER] Working directory: ${process.cwd()}`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('[CHOREO-SERVER] Received shutdown signal, closing server...');
      server.close(() => {
        console.log('[CHOREO-SERVER] Server closed successfully');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  }).catch((error) => {
    console.error('[CHOREO-SERVER] Failed to prepare Next.js app:', error);
    process.exit(1);
  });
}

// Start the server
startServer(); 