/**
 * Production Server for LUMO Inventory System
 * 
 * Clean, reliable Next.js server with proper CSS handling
 * and manifest validation integration.
 */

const { createServer } = require('http');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

console.log('[SERVER] Starting LUMO Inventory System...');
console.log('[SERVER] Environment:', process.env.NODE_ENV);
console.log('[SERVER] Development mode:', dev);
console.log('[SERVER] Hostname:', hostname);
console.log('[SERVER] Port:', port);

// Initialize Next.js application
const app = next({ 
  dev, 
  hostname, 
  port,
  // Use custom directory if needed
  dir: process.cwd(),
  // Ensure proper configuration loading
  conf: undefined,
  // Quiet mode for production
  quiet: !dev
});

const handle = app.getRequestHandler();

// Enhanced error handling for CSS-related issues
const handleCSSErrors = (error, req, res) => {
  console.error('[SERVER] CSS handling error:', {
    url: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  // If it's a CSS file request that failed, serve fallback
  if (req.url && req.url.includes('.css')) {
    const fallbackCSS = `
      /* Fallback CSS served due to error */
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
      }
      .error-message {
        color: #d73a49;
        background: #ffeef0;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #fdaeb7;
        margin: 20px 0;
      }
    `;
    
    res.writeHead(200, {
      'Content-Type': 'text/css',
      'Cache-Control': 'no-cache',
    });
    res.end(fallbackCSS);
    return;
  }

  // For other errors, let Next.js handle them
  throw error;
};

// Custom request handler with enhanced error handling
const customRequestHandler = async (req, res) => {
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
        version: process.env.npm_package_version || '0.1.0'
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
          errors: validator.errors,
          warnings: validator.warnings,
          fixes: validator.fixes
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

    // Enhanced static file serving for CSS files
    if (req.url && req.url.startsWith('/static/css/')) {
      const filePath = path.join(process.cwd(), '.next', req.url);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        res.end(content);
        return;
      } else {
        // Serve fallback CSS if file doesn't exist
        console.warn(`[SERVER] CSS file not found: ${filePath}, serving fallback`);
        handleCSSErrors(new Error('CSS file not found'), req, res);
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

    // Try to handle CSS-related errors gracefully
    if (error.message && error.message.includes('entryCSSFiles')) {
      handleCSSErrors(error, req, res);
      return;
    }

    // For other errors, send a generic error response
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
              .error { color: #d73a49; background: #ffeef0; padding: 20px; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>Server Error</h1>
              <p>An error occurred while processing your request.</p>
              <p><strong>Error:</strong> ${error.message}</p>
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
  
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Main server startup
app.prepare()
  .then(() => {
    console.log('[SERVER] Next.js application prepared successfully');
    
    // Create HTTP server
    const server = createServer(customRequestHandler);
    
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
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[SERVER] Uncaught exception:', error);
      
      // If it's a CSS-related error, log it but don't crash
      if (error.message && error.message.includes('entryCSSFiles')) {
        console.error('[SERVER] CSS manifest error caught, but server will continue running');
        return;
      }
      
      // For other critical errors, exit gracefully
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[SERVER] Unhandled rejection at:', promise, 'reason:', reason);
      
      // If it's a CSS-related error, log it but don't crash
      if (reason && reason.message && reason.message.includes('entryCSSFiles')) {
        console.error('[SERVER] CSS manifest rejection caught, but server will continue running');
        return;
      }
    });

  })
  .catch((error) => {
    console.error('[SERVER] Failed to start server:', error);
    process.exit(1);
  });
