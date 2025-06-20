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

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '8080', 10);

console.log('🚀 Starting LUMO Inventory Management Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🌐 Hostname: ${hostname}`);
console.log(`🔌 Port: ${port}`);

// Create Next.js app instance
const app = next({ 
  dev, 
  hostname, 
  port,
  // Use current directory for standalone build
  dir: process.cwd()
});

const handle = app.getRequestHandler();

async function startServer() {
  try {
    console.log('⏳ Preparing Next.js application...');
    await app.prepare();
    
    console.log('🔧 Creating HTTP server...');
    const server = createServer(async (req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Handle the request
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('❌ Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Error handling for server
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('📡 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('📡 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    // Start listening
    server.listen(port, hostname, () => {
      console.log('🎉 LUMO Server successfully started!');
      console.log(`🌐 Server running at http://${hostname}:${port}`);
      console.log('📊 Health check: /api/health');
      console.log('🏠 Dashboard: /dashboard');
      console.log('✅ Ready for Choreo deployment');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
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

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
