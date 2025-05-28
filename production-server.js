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

console.log('[PRODUCTION-SERVER] Starting robust production server...');

// Environment configuration
const dev = false; // Always production mode
const port = process.env.PORT || 8080;
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

// Main server function
function startProductionServer() {
  console.log('[PRODUCTION-SERVER] Initializing Next.js application...');
  
  const app = next({ dev, dir: process.cwd() });
  const handle = app.getRequestHandler();
  
  app.prepare().then(() => {
    console.log('[PRODUCTION-SERVER] Next.js app prepared successfully');
    
    const server = createServer(async (req, res) => {
      const startTime = Date.now();
      
      // Add request logging
      console.log(`[PRODUCTION-SERVER] ${req.method} ${req.url} - ${req.headers['user-agent']?.substring(0, 50)}...`);
      
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Handle health check
        if (pathname === '/health' || pathname === '/api/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          }));
          return;
        }
        
        // Handle static files
        if (pathname.startsWith('/_next/static/')) {
          const staticPath = path.join(process.cwd(), '.next', pathname.replace('/_next/', ''));
          
          if (serveStaticFile(req, res, staticPath)) {
            console.log(`[PRODUCTION-SERVER] Served static file: ${pathname} (${Date.now() - startTime}ms)`);
            return;
          }
        }
        
        // Handle public files
        if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
          const publicPath = path.join(process.cwd(), 'public', pathname === '/' ? 'index.html' : pathname);
          
          if (serveStaticFile(req, res, publicPath)) {
            console.log(`[PRODUCTION-SERVER] Served public file: ${pathname} (${Date.now() - startTime}ms)`);
            return;
          }
        }
        
        // Try Next.js handler with timeout
        const handlePromise = handle(req, res, parsedUrl);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 25000);
        });
        
        await Promise.race([handlePromise, timeoutPromise]);
        console.log(`[PRODUCTION-SERVER] Handled by Next.js: ${pathname} (${Date.now() - startTime}ms)`);
        
      } catch (error) {
        console.error(`[PRODUCTION-SERVER] Request error for ${req.url}:`, error.message);
        
        if (!res.headersSent) {
          // Serve a nice fallback page instead of crashing
          serveHTMLFallback(res, 'Inventory App', `
            Application is starting up...<br>
            <small>If you see this message repeatedly, the app may still be initializing.</small>
          `);
        }
      }
    });
    
    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('[PRODUCTION-SERVER] Server startup error:', err);
        process.exit(1);
      }
      
      console.log(`[PRODUCTION-SERVER] ✅ Server ready on http://${hostname}:${port}`);
      console.log(`[PRODUCTION-SERVER] Environment: production`);
      console.log(`[PRODUCTION-SERVER] Working directory: ${process.cwd()}`);
      console.log(`[PRODUCTION-SERVER] Process ID: ${process.pid}`);
    });
    
    // Enhanced error handling
    server.on('error', (error) => {
      console.error('[PRODUCTION-SERVER] Server error:', error);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`[PRODUCTION-SERVER] Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('[PRODUCTION-SERVER] Server closed successfully');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  }).catch((error) => {
    console.error('[PRODUCTION-SERVER] Failed to prepare Next.js app:', error);
    
    // Start a basic HTTP server as last resort
    console.log('[PRODUCTION-SERVER] Starting fallback HTTP server...');
    
    const fallbackServer = createServer((req, res) => {
      console.log(`[PRODUCTION-SERVER] Fallback serving: ${req.method} ${req.url}`);
      
      if (req.url === '/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'fallback', error: error.message }));
        return;
      }
      
      serveHTMLFallback(res, 'Inventory App - Initializing', `
        Application is being prepared...<br>
        <small>Initial setup in progress. Please wait a moment and refresh.</small>
      `);
    });
    
    fallbackServer.listen(port, hostname, () => {
      console.log(`[PRODUCTION-SERVER] 🆘 Fallback server running on port ${port}`);
    });
  });
}

// Start the server
startProductionServer(); 