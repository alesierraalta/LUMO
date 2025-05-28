const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

// Configure global timeout
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const STATIC_FILE_CACHE = new Map(); // Simple cache for static files

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
console.log('[CHOREO-SERVER] Server version: 1.1.0 (enhanced network resilience)');

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
        // Create directory if it doesn't exist
        fs.mkdirSync(staticDest, { recursive: true });
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
        // Create directory if it doesn't exist
        fs.mkdirSync(publicDest, { recursive: true });
      }
    }
    
    return standaloneDir;
  }
  
  return null;
}

// Helper function to copy directories recursively with retry logic
function copyDirectoryRecursive(src, dest, retries = 3) {
  if (!fs.existsSync(dest)) {
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      if (retries > 0) {
        console.log(`[CHOREO-SERVER] Retrying directory creation (${retries} attempts left)...`);
        setTimeout(() => copyDirectoryRecursive(src, dest, retries - 1), 1000);
        return;
      }
      throw err;
    }
  }
  
  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDirectoryRecursive(srcPath, destPath);
      } else {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (err) {
          // Skip large files that might cause issues
          if (err.code === 'ENOSPC' || err.code === 'EIO') {
            console.log(`[CHOREO-SERVER] Skipping problematic file: ${srcPath}`);
            continue;
          }
          throw err;
        }
      }
    }
  } catch (err) {
    if (retries > 0) {
      console.log(`[CHOREO-SERVER] Retrying copy operation (${retries} attempts left)...`);
      setTimeout(() => copyDirectoryRecursive(src, dest, retries - 1), 1000);
      return;
    }
    throw err;
  }
}

// Function to serve static files with caching
function serveStaticFile(req, res, filePath) {
  try {
    // Check cache first
    if (STATIC_FILE_CACHE.has(filePath)) {
      const cachedData = STATIC_FILE_CACHE.get(filePath);
      res.setHeader('Content-Type', cachedData.contentType);
      res.setHeader('Content-Length', cachedData.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Cache', 'HIT');
      res.end(cachedData.content);
      return true;
    }
    
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
    res.setHeader('X-Cache', 'MISS');
    
    // Set caching headers for static assets
    if (req.url.includes('/_next/static/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    // For small files (under 1MB), cache in memory
    if (stat.size < 1024 * 1024) {
      const content = fs.readFileSync(filePath);
      STATIC_FILE_CACHE.set(filePath, {
        content,
        contentType,
        size: stat.size
      });
      
      res.end(content);
      return true;
    }
    
    // For larger files, stream them
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

// Function to serve a fallback page
function serveFallbackPage(res, message = 'Application is loading...') {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Inventory Management System</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin: 0;
            padding: 0;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 600px;
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
          // Auto-refresh after 5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 5000);
          
          function checkStatus() {
            fetch('/api/health')
              .then(response => response.json())
              .then(data => {
                console.log('Server status:', data);
                if (data.status === 'healthy') {
                  window.location.href = '/';
                } else {
                  window.location.reload();
                }
              })
              .catch(err => {
                console.error('Status check failed:', err);
                window.location.reload();
              });
          }
        </script>
      </body>
    </html>
  `);
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
  
  // Enhanced error handling for Next.js initialization
  let nextAppInitRetries = 0;
  const MAX_RETRIES = 3;
  
  function initNextApp() {
    const app = next({ dev, dir: process.cwd() });
    
    app.prepare().then(() => {
      console.log('[CHOREO-SERVER] Next.js app prepared successfully');
      startHttpServer(app);
    }).catch((error) => {
      console.error('[CHOREO-SERVER] Failed to prepare Next.js app:', error);
      
      if (nextAppInitRetries < MAX_RETRIES) {
        nextAppInitRetries++;
        console.log(`[CHOREO-SERVER] Retrying Next.js initialization (${nextAppInitRetries}/${MAX_RETRIES})...`);
        setTimeout(initNextApp, 3000 * nextAppInitRetries);
      } else {
        console.log('[CHOREO-SERVER] Max retries reached, starting fallback server');
        startFallbackServer();
      }
    });
  }
  
  function startHttpServer(app) {
    const handle = app.getRequestHandler();
    
    const server = createServer(async (req, res) => {
      // Set a timeout to ensure responses don't hang
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.log('[CHOREO-SERVER] Request timeout, sending error response');
          serveFallbackPage(res, 'Request took too long to process. Please try again.');
        }
      }, DEFAULT_TIMEOUT);
      
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Handle health check immediately
        if (pathname === '/api/health' || pathname === '/health') {
          clearTimeout(timeout);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            uptime: process.uptime(),
            version: '1.1.0'
          }));
          return;
        }
        
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
            serveFallbackPage(res, 'Application is starting up. Please wait a moment and refresh.');
          }
        }
        
      } catch (error) {
        clearTimeout(timeout);
        console.error('[CHOREO-SERVER] Request handling error:', error.message);
        
        if (!res.headersSent) {
          serveFallbackPage(res, 'We encountered an error. The application is initializing.');
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
      
      // Force exit after 10 seconds
      setTimeout(() => {
        console.log('[CHOREO-SERVER] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
  
  function startFallbackServer() {
    console.log('[CHOREO-SERVER] Starting minimal fallback server');
    
    const server = createServer((req, res) => {
      const { pathname } = parse(req.url, true);
      
      // Handle health check
      if (pathname === '/api/health' || pathname === '/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'initializing',
          timestamp: new Date().toISOString(),
          message: 'Application is starting in fallback mode'
        }));
        return;
      }
      
      serveFallbackPage(res, 'Application is starting in fallback mode. Please wait...');
    });
    
    server.listen(port, hostname, () => {
      console.log(`[CHOREO-SERVER] Fallback server running on http://${hostname}:${port}`);
    });
  }
  
  // Start the Next.js application
  initNextApp();
}

// Start the server
startServer(); 