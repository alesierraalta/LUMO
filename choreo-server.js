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
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Handle static files
        if (pathname.startsWith('/_next/static/')) {
          const staticPath = path.join(process.cwd(), '.next', pathname.replace('/_next/', ''));
          
          if (serveStaticFile(req, res, staticPath)) {
            return;
          }
        }
        
        // Handle public files
        if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
          const publicPath = path.join(process.cwd(), 'public', pathname === '/' ? 'index.html' : pathname);
          
          if (serveStaticFile(req, res, publicPath)) {
            return;
          }
        }
        
        // Let Next.js handle everything else
        await handle(req, res, parsedUrl);
        
      } catch (error) {
        console.error('[CHOREO-SERVER] Request handling error:', error.message);
        
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Server Error</title></head>
              <body>
                <h1>Internal Server Error</h1>
                <p>The server encountered an error while processing your request.</p>
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