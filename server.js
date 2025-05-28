/**
 * Production Server for LUMO Inventory System
 * 
 * Properly configured for Next.js standalone mode
 */

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// Environment configuration
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 8080;
const dev = process.env.NODE_ENV !== 'production';

console.log('[SERVER] Starting LUMO Inventory System...');
console.log('[SERVER] Environment:', process.env.NODE_ENV);
console.log('[SERVER] Development mode:', dev);
console.log('[SERVER] Hostname:', hostname);
console.log('[SERVER] Port:', port);

// Run runtime environment fix for production
if (!dev) {
  console.log('[SERVER] Running runtime environment fix...');
  try {
    const runtimeFix = require('./scripts/runtime-env-fix');
    runtimeFix.main();
  } catch (error) {
    console.warn('[SERVER] Runtime environment fix failed:', error.message);
  }
}

// For standalone mode, use the generated server
if (!dev && fs.existsSync('.next/standalone/server.js')) {
  console.log('[SERVER] Using Next.js standalone server');
  
  // Set the correct working directory for standalone
  process.chdir(path.join(__dirname, '.next/standalone'));
  
  // Set required environment variables for standalone
  process.env.HOSTNAME = hostname;
  process.env.PORT = port;
  
  // Load and start the standalone server (FIXED: use correct path)
  require('./.next/standalone/server.js');
  
} else {
  // For development or when standalone is not available, use Next.js directly
  console.log('[SERVER] Using Next.js development server');
  
  const next = require('next');
  
  const app = next({ 
    dev,
    hostname,
    port,
    dir: __dirname
  });
  
  const handle = app.getRequestHandler();
  
  const requestHandler = async (req, res) => {
    try {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Handle health check
      if (req.url === '/health' || req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '0.1.0',
          mode: dev ? 'development' : 'production'
        }));
        return;
      }

      // Handle manifest validation endpoint
      if (req.url === '/api/manifest-status') {
        try {
          const ManifestValidator = require('./scripts/manifest-validator');
          const validator = new ManifestValidator();
          const isValid = await validator.validate();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            manifestsValid: isValid,
            errors: validator.errors || [],
            warnings: validator.warnings || [],
            fixes: validator.fixes || 0
          }));
          return;
        } catch (validationError) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Manifest validation failed',
            details: validationError.message
          }));
          return;
        }
      }

      // Let Next.js handle all other requests
      await handle(req, res);
      
    } catch (error) {
      console.error('[SERVER] Request handling error:', {
        url: req.url,
        method: req.method,
        error: error.message
      });

      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>LUMO - Server Error</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  margin: 40px; 
                  background: #f8f9fa;
                }
                .error { 
                  color: #721c24; 
                  background: #f8d7da; 
                  padding: 20px; 
                  border-radius: 6px; 
                  border: 1px solid #f5c6cb;
                  max-width: 600px;
                }
                .logo { color: #007bff; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="logo">🔥 LUMO</div>
              <div class="error">
                <h1>Server Error</h1>
                <p>LUMO encountered an error while processing your request.</p>
                <details>
                  <summary>Error Details</summary>
                  <p><strong>Error:</strong> ${error.message}</p>
                </details>
                <p><a href="/">← Return to Dashboard</a></p>
              </div>
            </body>
          </html>
        `);
      }
    }
  };

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`[SERVER] Received ${signal}, starting graceful shutdown...`);
    
    if (server) {
      server.close(() => {
        console.log('[SERVER] HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('[SERVER] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  // Main server startup
  app.prepare()
    .then(() => {
      console.log('[SERVER] Next.js application prepared successfully');
      
      // Create HTTP server
      const server = createServer(requestHandler);
      
      // Handle server errors
      server.on('error', (error) => {
        console.error('[SERVER] HTTP server error:', error);
        
        if (error.code === 'EADDRINUSE') {
          console.error(`[SERVER] Port ${port} is already in use`);
          process.exit(1);
        }
      });

      // Start listening
      server.listen(port, hostname, () => {
        console.log(`[SERVER] Ready on http://${hostname}:${port}`);
        console.log('[SERVER] Health check available at /health');
        console.log('[SERVER] Manifest status available at /api/manifest-status');
        console.log('[SERVER] LUMO Inventory System is now running!');
      });

      // Setup graceful shutdown
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('[SERVER] Uncaught exception:', error);
        gracefulShutdown('uncaughtException');
      });

      process.on('unhandledRejection', (reason, promise) => {
        console.error('[SERVER] Unhandled rejection at:', promise, 'reason:', reason);
      });

    })
    .catch((error) => {
      console.error('[SERVER] Failed to start server:', error);
      process.exit(1);
    });
}
