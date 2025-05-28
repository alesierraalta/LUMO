const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Load runtime protection for entryCSSFiles errors
try {
  require('./runtime-protection.js');
} catch (e) {
  console.log('[SAFE-SERVER] Runtime protection not found, continuing without it');
}

console.log('[SAFE-SERVER] Starting Next.js application with safe implementation...');

// Detect if we're running in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next/standalone'));
console.log('[SAFE-SERVER] Running in standalone mode:', isStandalone);

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 8080;

console.log('[SAFE-SERVER] Environment:', process.env.NODE_ENV);
console.log('[SAFE-SERVER] Port:', port);

// Try standalone first, but with safe fallback
if (isStandalone) {
  const standaloneServerPath = path.join(process.cwd(), '.next/standalone/server.js');
  
  if (fs.existsSync(standaloneServerPath)) {
    console.log('[SAFE-SERVER] Attempting to use standalone server...');
    
    try {
      // Check if static files are properly located
      const standaloneStaticPath = path.join(process.cwd(), '.next/standalone/.next/static');
      const mainStaticPath = path.join(process.cwd(), '.next/static');
      
      if (!fs.existsSync(standaloneStaticPath) && fs.existsSync(mainStaticPath)) {
        console.log('[SAFE-SERVER] Copying static files to standalone directory...');
        
        // Ensure the standalone .next directory exists
        const standaloneNextDir = path.join(process.cwd(), '.next/standalone/.next');
        fs.mkdirSync(standaloneNextDir, { recursive: true });
        
        // Copy static files
        copyDirectorySync(mainStaticPath, standaloneStaticPath);
        console.log('[SAFE-SERVER] Static files copied successfully');
      }
      
      // Also copy public directory if it exists
      const publicPath = path.join(process.cwd(), 'public');
      const standalonePublicPath = path.join(process.cwd(), '.next/standalone/public');
      
      if (fs.existsSync(publicPath) && !fs.existsSync(standalonePublicPath)) {
        console.log('[SAFE-SERVER] Copying public files to standalone directory...');
        copyDirectorySync(publicPath, standalonePublicPath);
        console.log('[SAFE-SERVER] Public files copied successfully');
      }
      
      // Set working directory to standalone
      process.chdir(path.join(process.cwd(), '.next/standalone'));
      console.log('[SAFE-SERVER] Changed working directory to standalone mode');
      
      // Simple require without complex error handling
      require('./server.js');
      console.log('[SAFE-SERVER] Standalone server loaded successfully');
      // If we get here, standalone server is running
    } catch (error) {
      console.log('[SAFE-SERVER] Standalone server failed:', error.message);
      console.log('[SAFE-SERVER] Falling back to custom Next.js server...');
      
      // Reset working directory if it was changed
      try {
        process.chdir(path.resolve(__dirname));
      } catch (e) {
        // Ignore chdir errors
      }
      
      // Fallback to our implementation
      startCustomServer();
    }
  } else {
    console.log('[SAFE-SERVER] Standalone server.js not found, using custom server');
    startCustomServer();
  }
} else {
  console.log('[SAFE-SERVER] Not in standalone mode, using custom server');
  startCustomServer();
}

// Helper function to copy directories recursively
function copyDirectorySync(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDirectorySync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } catch (error) {
    console.log(`[SAFE-SERVER] Error copying ${src} to ${dest}:`, error.message);
  }
}

function startCustomServer() {
  console.log('[SAFE-SERVER] Initializing custom Next.js server...');
  
  const app = next({ dev });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    console.log('[SAFE-SERVER] Next.js app prepared successfully');
    
    const server = createServer((req, res) => {
      // Add basic error handling for requests
      try {
        // Handle static files manually if needed
        if (req.url && req.url.startsWith('/_next/static/')) {
          const staticFilePath = path.join(process.cwd(), '.next', req.url.replace('/_next/', ''));
          
          if (fs.existsSync(staticFilePath)) {
            const ext = path.extname(staticFilePath);
            const mimeTypes = {
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.eot': 'application/vnd.ms-fontobject',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.ico': 'image/x-icon'
            };
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            
            const fileStream = fs.createReadStream(staticFilePath);
            fileStream.pipe(res);
            return;
          }
        }
        
        // Handle public files
        if (req.url && !req.url.startsWith('/_next/') && !req.url.startsWith('/api/')) {
          const publicFilePath = path.join(process.cwd(), 'public', req.url === '/' ? 'index.html' : req.url);
          
          if (fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).isFile()) {
            const ext = path.extname(publicFilePath);
            const mimeTypes = {
              '.html': 'text/html',
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.json': 'application/json',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2'
            };
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            
            const fileStream = fs.createReadStream(publicFilePath);
            fileStream.pipe(res);
            return;
          }
        }
        
        handle(req, res);
      } catch (error) {
        console.error('[SAFE-SERVER] Request handling error:', error.message);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('[SAFE-SERVER] Server startup error:', err);
        process.exit(1);
      }
      console.log(`[SAFE-SERVER] ✅ Next.js server ready on port ${port}`);
      console.log(`[SAFE-SERVER] Local: http://localhost:${port}`);
      console.log(`[SAFE-SERVER] Network: http://0.0.0.0:${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('[SAFE-SERVER] Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('[SAFE-SERVER] Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[SAFE-SERVER] Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('[SAFE-SERVER] Server closed');
        process.exit(0);
      });
    });
    
  }).catch((error) => {
    console.error('[SAFE-SERVER] Error preparing Next.js app:', error);
    process.exit(1);
  });
} 