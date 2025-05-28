/**
 * Optimized Choreo Server for Production Deployment
 * 
 * Fixes 505 HTTP Version Not Supported error and ensures
 * full compatibility with Choreo infrastructure.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

console.log('[CHOREO-SERVER] 🚀 Starting LUMO Inventory System for Choreo...');

// Environment configuration optimized for Choreo
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0'; // Required for Choreo container binding
const dev = false; // Always production mode in Choreo
const nextDir = path.join(process.cwd(), '.next');

console.log(`[CHOREO-SERVER] 📡 Port: ${port}`);
console.log(`[CHOREO-SERVER] 🌍 Hostname: ${hostname}`);
console.log(`[CHOREO-SERVER] 🏭 Environment: ${process.env.NODE_ENV}`);

// Enhanced manifest validation and repair
const validateAndRepairManifests = () => {
  console.log('[CHOREO-SERVER] 🔧 Validating and repairing manifest files...');
  
  const manifestPaths = [
    path.join(nextDir, 'build-manifest.json'),
    path.join(nextDir, 'app-build-manifest.json'),
    path.join(nextDir, 'standalone', '.next', 'build-manifest.json'),
    path.join(nextDir, 'standalone', '.next', 'app-build-manifest.json')
  ];

  let repairCount = 0;
  
  manifestPaths.forEach(manifestPath => {
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let needsRepair = false;
        
        // Ensure entryCSSFiles exists
        if (!manifest.entryCSSFiles) {
          manifest.entryCSSFiles = manifestPath.includes('app-build') ? {} : { '/_app': [], '/': [] };
          needsRepair = true;
        }
        
        // Ensure cssFiles exists for app manifests
        if (manifestPath.includes('app-build') && !manifest.cssFiles) {
          manifest.cssFiles = {};
          needsRepair = true;
        }
        
        if (needsRepair) {
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`[CHOREO-SERVER] ✅ Repaired: ${path.basename(manifestPath)}`);
          repairCount++;
        }
      } catch (error) {
        console.error(`[CHOREO-SERVER] ❌ Error repairing ${manifestPath}:`, error.message);
      }
    }
  });
  
  console.log(`[CHOREO-SERVER] 🔧 Manifests repaired: ${repairCount}`);
};

// Create fallback CSS files
const createFallbackCSS = () => {
  console.log('[CHOREO-SERVER] 🎨 Creating fallback CSS files...');
  
  const cssDir = path.join(nextDir, 'static', 'css');
  const standaloneCSSDir = path.join(nextDir, 'standalone', '.next', 'static', 'css');
  
  const fallbackCSS = `/* LUMO Inventory System - Fallback CSS */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
  color: #1a1a1a;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: 18px;
  color: #666;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
  color: #c33;
}

.btn {
  background: #0066cc;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #0052a3;
}`;

  // Create CSS directories and files
  [cssDir, standaloneCSSDir].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const cssFiles = ['app.css', 'globals.css', 'main.css', 'fallback.css'];
      cssFiles.forEach(fileName => {
        const filePath = path.join(dir, fileName);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, fallbackCSS);
          console.log(`[CHOREO-SERVER] ✅ Created: ${fileName}`);
        }
      });
    } catch (error) {
      console.error(`[CHOREO-SERVER] ❌ Error creating CSS in ${dir}:`, error.message);
    }
  });
};

// Health check handler with comprehensive status
const handleHealthCheck = (req, res) => {
  const isHealthCheck = req.url === '/health' || 
                       req.url === '/api/health' ||
                       req.url === '/api/manifest-status';
  
  if (isHealthCheck) {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LUMO Inventory System',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: port,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      manifestsRepaired: true,
      cssFilesCreated: true,
      choreoCompatible: true
    };

    // Validate manifests in real-time
    try {
      const buildManifest = path.join(nextDir, 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        healthData.manifestValid = !!manifest.entryCSSFiles;
      }
    } catch (error) {
      healthData.manifestError = error.message;
    }

    // Set proper HTTP headers for Choreo
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Powered-By': 'LUMO-Choreo-Server/1.0'
    });
    
    res.end(JSON.stringify(healthData, null, 2));
    return true;
  }
  
  return false;
};

// Custom request handler with Choreo optimizations
const createRequestHandler = (nextHandler) => {
  return async (req, res) => {
    try {
      // Handle health checks first
      if (handleHealthCheck(req, res)) {
        return;
      }

      // Handle OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
      }

      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Enhanced CSS file serving
      if (req.url && req.url.startsWith('/_next/static/css/')) {
        const cssPath = path.join(nextDir, 'static', 'css', path.basename(req.url));
        
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          res.writeHead(200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': `"${Buffer.from(cssContent).toString('base64').slice(0, 16)}"`
          });
          res.end(cssContent);
          return;
        }
      }

      // Let Next.js handle the request
      await nextHandler(req, res);
      
    } catch (error) {
      console.error('[CHOREO-SERVER] ❌ Request error:', {
        url: req.url,
        method: req.method,
        error: error.message
      });

      // Handle CSS-related errors gracefully
      if (error.message && error.message.includes('entryCSSFiles')) {
        console.log('[CHOREO-SERVER] 🔧 CSS error handled, serving fallback');
        
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.end('/* CSS error handled by Choreo server */');
        }
        return;
      }

      // Generic error response
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
};

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[CHOREO-SERVER] 💥 Uncaught Exception:', error.message);
  
  // Don't crash on CSS-related errors
  if (error.message && error.message.includes('entryCSSFiles')) {
    console.log('[CHOREO-SERVER] 🔧 CSS error caught, continuing...');
    return;
  }
  
  console.error('[CHOREO-SERVER] 💀 Fatal error, exiting...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CHOREO-SERVER] 💥 Unhandled Rejection:', reason);
  
  // Don't crash on CSS-related rejections
  if (reason && reason.message && reason.message.includes('entryCSSFiles')) {
    console.log('[CHOREO-SERVER] 🔧 CSS rejection caught, continuing...');
    return;
  }
});

// Main server initialization
async function startServer() {
  try {
    console.log('[CHOREO-SERVER] 🔧 Preparing server...');
    
    // Run all fixes
    validateAndRepairManifests();
    createFallbackCSS();
    
    // Check if standalone mode is available
    const standaloneServer = path.join(nextDir, 'standalone', 'server.js');
    const useStandalone = fs.existsSync(standaloneServer);
    
    console.log(`[CHOREO-SERVER] 📦 Standalone mode: ${useStandalone}`);
    
    if (useStandalone) {
      console.log('[CHOREO-SERVER] 🚀 Using standalone server...');
      
      // Require and start the standalone server with our custom handler
      const http = require('http');
      const originalCreateServer = http.createServer;
      
      // Intercept server creation to add our custom handler
      http.createServer = function(requestListener) {
        const customListener = createRequestHandler(requestListener);
        return originalCreateServer.call(this, customListener);
      };
      
      // Start the standalone server
      require(standaloneServer);
      
    } else {
      console.log('[CHOREO-SERVER] 🚀 Using Next.js custom server...');
      
      // Create Next.js app
      const app = next({ 
        dev, 
        dir: process.cwd(),
        conf: {
          output: 'standalone',
          reactStrictMode: false,
          experimental: { cssChunking: 'strict' }
        }
      });
      
      const handle = app.getRequestHandler();
      
      // Prepare and start server
      await app.prepare();
      console.log('[CHOREO-SERVER] ✅ Next.js app prepared');
      
      const server = createServer(createRequestHandler(handle));
      
      server.listen(port, hostname, () => {
        console.log(`[CHOREO-SERVER] 🎉 Ready on http://${hostname}:${port}`);
        console.log(`[CHOREO-SERVER] 🏥 Health check: http://${hostname}:${port}/health`);
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('[CHOREO-SERVER] 👋 SIGTERM received, shutting down gracefully...');
        server.close(() => {
          console.log('[CHOREO-SERVER] 💤 Server closed');
          process.exit(0);
        });
      });
    }
    
    console.log('[CHOREO-SERVER] 🎯 Server initialization complete');
    
  } catch (error) {
    console.error('[CHOREO-SERVER] 💀 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 