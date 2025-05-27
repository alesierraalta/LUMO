const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

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
      // Simple require without complex error handling
      require(standaloneServerPath);
      console.log('[SAFE-SERVER] Standalone server loaded successfully');
      // If we get here, standalone server is running
    } catch (error) {
      console.log('[SAFE-SERVER] Standalone server failed:', error.message);
      console.log('[SAFE-SERVER] Falling back to custom Next.js server...');
      
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

function startCustomServer() {
  console.log('[SAFE-SERVER] Initializing custom Next.js server...');
  
  const app = next({ dev });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    console.log('[SAFE-SERVER] Next.js app prepared successfully');
    
    const server = createServer((req, res) => {
      // Add basic error handling for requests
      try {
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