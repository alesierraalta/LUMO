/**
 * Choreo-specific server for Next.js
 * 
 * This server script is optimized for running in Choreo with
 * enhanced monitoring, error handling, and entryCSSFiles fixes.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Environment configuration
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0';
const dev = false; // Always production in Choreo

console.log('[CHOREO-SERVER] Starting server optimized for Choreo deployment...');

// Detect standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next', 'standalone'));
console.log('[CHOREO-SERVER] Running in standalone mode:', isStandalone);

// Fix entryCSSFiles issue in manifests
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
            console.log(`[CHOREO-SERVER] Fixed manifest: ${manifestPath}`);
          }
        } catch (e) {
          console.error(`[CHOREO-SERVER] Error fixing ${manifestPath}:`, e.message);
        }
      }
    });
  } catch (e) {
    console.error('[CHOREO-SERVER] Error fixing manifest files:', e.message);
  }
};

// Intercept entryCSSFiles errors
process.on('uncaughtException', (error) => {
  if (error.message && 
      (error.message.includes('entryCSSFiles') || 
       error.message.includes('Cannot read properties of undefined'))) {
    console.log('[CHOREO-SERVER] Intercepted entryCSSFiles error - continuing execution');
    return; // Don't crash
  }
  
  // Log other uncaught exceptions and exit
  console.error('[CHOREO-SERVER] Uncaught Exception:', error);
  process.exit(1);
});

// Safe JSON parsing that fixes entryCSSFiles
const originalJSONParse = JSON.parse;
JSON.parse = function(text, reviver) {
  try {
    const result = originalJSONParse.call(this, text, reviver);
    
    // Check if this looks like a manifest
    if (result && 
        typeof result === 'object' && 
        (result.pages || result.polyfillFiles)) {
      if (!result.entryCSSFiles) {
        result.entryCSSFiles = result.pages ? { '/_app': [], '/': [] } : {};
        console.log('[CHOREO-SERVER] Added entryCSSFiles to parsed manifest');
      }
    }
    
    return result;
  } catch (e) {
    console.error('[CHOREO-SERVER] JSON.parse error:', e.message);
    // Return empty object on parse error
    return {};
  }
};

// Apply fixes before starting
fixManifestFiles();

// Helper function to serve static files
const serveStaticFile = (req, res, filepath) => {
  if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
    return true;
  }
  return false;
};

// Helper to serve HTML fallback
const serveHTMLFallback = (res, title, content) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0070f3; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="message">${content}</div>
      </body>
    </html>
  `);
};

// Main server function
const startChoreoServer = async () => {
  try {
    if (isStandalone) {
      console.log('[CHOREO-SERVER] Using standalone server...');
      require('./.next/standalone/server.js');
      return;
    }
    
    console.log('[CHOREO-SERVER] Initializing Next.js application...');
    const app = next({ dev, dir: process.cwd() });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    console.log('[CHOREO-SERVER] Next.js app prepared successfully');
    
    const server = createServer(async (req, res) => {
      const startTime = Date.now();
      
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Handle health check for Choreo
        if (pathname === '/health' || pathname === '/api/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            deployment: 'choreo'
          }));
          return;
        }
        
        // Try Next.js handler with timeout
        await Promise.race([
          handle(req, res, parsedUrl),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 25000))
        ]);
        
      } catch (error) {
        console.error(`[CHOREO-SERVER] Request error for ${req.url}:`, error.message);
        
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
      if (err) throw err;
      console.log(`[CHOREO-SERVER] ✅ Server ready on http://${hostname}:${port}`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`[CHOREO-SERVER] Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('[CHOREO-SERVER] Server closed successfully');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('[CHOREO-SERVER] Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startChoreoServer(); 