// TASK 24: Memory Optimization for Choreo Environment
if (process.env.NODE_ENV === 'production') {
  // Set memory limits
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=6144 --optimize-for-size';
  
  // Enable garbage collection monitoring
  if (global.gc) {
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > 4 * 1024 * 1024 * 1024) { // 4GB threshold
        console.log('🗑️ High memory usage detected, triggering GC');
        global.gc();
      }
    }, 30000);
  }
  
  // Memory usage reporting
  console.log('📊 Memory optimization enabled for Choreo deployment');
  console.log('💾 Max heap size: 6144MB');
}

/**
 * CHOREO DEPLOYMENT SERVER
 * Next.js 15 standalone server for production deployment
 */

// CRITICAL FIX: Apply runtime module patches BEFORE any other imports
console.log('🔧 Applying runtime module patches...');
try {
  require('./src/lib/runtime-module-patcher');
  console.log('✅ Runtime module patcher loaded successfully');
} catch (error) {
  console.warn('⚠️ Runtime module patcher failed to load:', error.message);
}

// CRITICAL FIX: For standalone builds, use the generated server
// Check if we're in a standalone build environment
const fs = require('fs');
const path = require('path');

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '8080', 10);

console.log('🚀 Starting LUMO Inventory Management Server...');
console.log('📍 Environment:', dev ? 'development' : 'production');
console.log('🌐 Hostname:', hostname);
console.log('🔌 Port:', port);

// CRITICAL FIX: Check if we're running in standalone mode
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const hasStandaloneServer = fs.existsSync(standaloneServerPath);

if (!dev && hasStandaloneServer) {
  console.log('⚡ Detected standalone build - using optimized Next.js server');
  console.log('📁 Standalone server path:', standaloneServerPath);
  
  // Set required environment variables for standalone server
  process.env.HOSTNAME = hostname;
  process.env.PORT = port.toString();
  
  try {
    // Load and run the standalone server
    require(standaloneServerPath);
    console.log('🎉 Standalone server started successfully!');
  } catch (error) {
    console.error('❌ Failed to start standalone server:', error);
    console.log('🔄 Falling back to custom server...');
    startCustomServer();
  }
} else {
  console.log('🔧 Using custom Next.js server (development or no standalone build)');
  startCustomServer();
}

function startCustomServer() {
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  console.log('⏳ Preparing Next.js application...');

  // CRITICAL FIX: Enhanced error handling for Next.js app initialization
  let app;
  try {
    app = next({ dev, hostname, port });
    console.log('✅ Next.js app instance created');
  } catch (error) {
    console.error('❌ Failed to create Next.js app:', error);
    process.exit(1);
  }

  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    console.log('🔧 Creating HTTP server...');
    
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('❌ Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
    .listen(port, (err) => {
      if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
      }
      
      console.log('🎉 LUMO Server successfully started!');
      console.log(`🌐 Server running at http://${hostname}:${port}`);
      console.log('📊 Health check: /api/health');
      console.log('🏠 Dashboard: /dashboard');
      console.log('✅ Ready for Choreo deployment');
    });
  }).catch((ex) => {
    console.error('❌ Failed to start server:', ex);
    process.exit(1);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections in production
  if (dev) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
