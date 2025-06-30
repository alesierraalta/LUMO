// LUMO Static Server - Standalone + Static Assets
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const STATIC_PORT = 8080;
const STANDALONE_PORT = 8081;

// Enhanced startup timeout management
const STARTUP_TIMEOUT = parseInt(process.env.STARTUP_TIMEOUT) || 60000; // 60 seconds default
const HEALTH_CHECK_INTERVAL = 5000; // 5 seconds
const MAX_STARTUP_ATTEMPTS = 3;

let startupAttempts = 0;
let standaloneProcess = null;
let startupTimer = null;
let healthCheckTimer = null;
let isShuttingDown = false;

console.log('🚀 [LUMO] Enhanced Static Server with Timeout Prevention - v2.0');
console.log(`⏱️  Startup timeout: ${STARTUP_TIMEOUT}ms`);
console.log(`🔄 Max startup attempts: ${MAX_STARTUP_ATTEMPTS}`);

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`🛑 [LUMO] Received ${signal}, initiating graceful shutdown...`);
  
  // Clear timers
  if (startupTimer) clearTimeout(startupTimer);
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  
  // Kill standalone process if running
  if (standaloneProcess && !standaloneProcess.killed) {
    console.log('🔪 [LUMO] Terminating standalone process...');
    standaloneProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (!standaloneProcess.killed) {
        console.log('💥 [LUMO] Force killing standalone process...');
        standaloneProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  // Exit after cleanup
  setTimeout(() => {
    console.log('✅ [LUMO] Graceful shutdown completed');
    process.exit(0);
  }, 2000);
};

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('💥 [LUMO] Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [LUMO] Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Health check function
const performHealthCheck = async () => {
  try {
    const response = await fetch(`http://localhost:${STANDALONE_PORT}/api/health`, {
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Enhanced standalone server startup with retry logic
const startStandaloneServer = () => {
  return new Promise((resolve, reject) => {
    startupAttempts++;
    console.log(`🚀 [LUMO] Starting standalone server (attempt ${startupAttempts}/${MAX_STARTUP_ATTEMPTS})...`);
    
    // Clear any existing timer
    if (startupTimer) clearTimeout(startupTimer);
    
    // Check if standalone build exists
    const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
    if (!fs.existsSync(standaloneServerPath)) {
      const error = new Error('Standalone server.js not found');
      console.error('❌ [LUMO] Standalone build missing:', error.message);
      return reject(error);
    }
    
    // Spawn the standalone process
    standaloneProcess = spawn('node', ['server.js'], {
      cwd: path.join(process.cwd(), '.next', 'standalone'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: STANDALONE_PORT.toString(),
        NODE_ENV: 'production'
      }
    });
    
    let startupOutput = '';
    let isResolved = false;
    
    // Set startup timeout
    startupTimer = setTimeout(() => {
      if (!isResolved) {
        console.error(`⏰ [LUMO] Startup timeout after ${STARTUP_TIMEOUT}ms (attempt ${startupAttempts})`);
        
        if (standaloneProcess && !standaloneProcess.killed) {
          standaloneProcess.kill('SIGKILL');
        }
        
        if (startupAttempts < MAX_STARTUP_ATTEMPTS) {
          console.log(`🔄 [LUMO] Retrying startup (${startupAttempts + 1}/${MAX_STARTUP_ATTEMPTS})...`);
          setTimeout(() => {
            startStandaloneServer().then(resolve).catch(reject);
          }, 2000);
        } else {
          isResolved = true;
          reject(new Error(`Startup failed after ${MAX_STARTUP_ATTEMPTS} attempts`));
        }
      }
    }, STARTUP_TIMEOUT);
    
    // Handle stdout
    standaloneProcess.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      
      // Log with prefix
      output.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`🔧 [STANDALONE] ${line}`);
        }
      });
      
      // Check for successful startup indicators
      if (output.includes('Ready in') || output.includes('ready on') || output.includes('started server')) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(startupTimer);
          console.log('✅ [STANDALONE] Server started successfully');
          
          // Start health check monitoring
          setTimeout(() => {
            performHealthCheck().then(healthy => {
              if (healthy) {
                console.log('🏥 [STANDALONE] Health check passed');
                resolve();
              } else {
                console.error('❌ [STANDALONE] Health check failed');
                reject(new Error('Health check failed after startup'));
              }
            });
          }, 2000);
        }
      }
    });
    
    // Handle stderr
    standaloneProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`🚨 [STANDALONE] ${output}`);
    });
    
    // Handle process exit
    standaloneProcess.on('close', (code, signal) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(startupTimer);
        
        if (code === 0) {
          console.log('✅ [STANDALONE] Process exited successfully');
          resolve();
        } else {
          console.error(`❌ [STANDALONE] Process exited with code ${code}, signal ${signal}`);
          
          if (startupAttempts < MAX_STARTUP_ATTEMPTS) {
            console.log(`🔄 [LUMO] Retrying startup (${startupAttempts + 1}/${MAX_STARTUP_ATTEMPTS})...`);
            setTimeout(() => {
              startStandaloneServer().then(resolve).catch(reject);
            }, 2000);
          } else {
            reject(new Error(`Process failed with code ${code} after ${MAX_STARTUP_ATTEMPTS} attempts`));
          }
        }
      }
    });
    
    // Handle spawn error
    standaloneProcess.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(startupTimer);
        console.error('💥 [STANDALONE] Spawn error:', error);
        reject(error);
      }
    });
  });
};

// Start static server
console.log(`🌐 [LUMO] Starting static assets server on port ${STATIC_PORT}`);

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Health endpoint for static server
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'lumo-static',
    timestamp: new Date().toISOString(),
    port: STATIC_PORT
  });
});

// Proxy all other requests to standalone server
app.use('/', createProxyMiddleware({
  target: `http://localhost:${STANDALONE_PORT}`,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('🚨 [PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Service temporarily unavailable',
        message: 'Standalone server is starting up...'
      });
    }
  }
}));

// Start the static server
const staticServer = app.listen(STATIC_PORT, '0.0.0.0', () => {
  console.log(`✅ [LUMO] Static server ready on port ${STATIC_PORT}`);
  
  // Start standalone server
  startStandaloneServer()
    .then(() => {
      console.log('🎉 [LUMO] All services started successfully!');
      
      // Start periodic health monitoring
      healthCheckTimer = setInterval(async () => {
        const healthy = await performHealthCheck();
        if (!healthy && !isShuttingDown) {
          console.warn('⚠️  [LUMO] Health check failed, standalone server may be down');
        }
      }, HEALTH_CHECK_INTERVAL);
    })
    .catch((error) => {
      console.error('💥 [LUMO] Standalone server failed to start:', error.message);
      gracefulShutdown('STARTUP_FAILURE');
    });
});

// Handle static server errors
staticServer.on('error', (error) => {
  console.error('💥 [LUMO] Static server error:', error);
  gracefulShutdown('STATIC_SERVER_ERROR');
});

console.log('🎯 [LUMO] Initialization complete, waiting for startup...'); 