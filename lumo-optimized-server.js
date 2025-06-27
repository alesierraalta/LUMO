// LUMO Ultra-Compact Server - Maximum efficiency, minimal code
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

// PORT VALIDATION AND CORRECTION
const validatePort = (port) => {
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 0 || numPort > 65535) {
    console.log(`⚠️ [LUMO] Invalid port ${port}, using default 8080`);
    return 8080;
  }
  return numPort;
};

const PORT = validatePort(process.env.PORT || 8080);
const standaloneServerPath = '.next/standalone/server.js';
const hasStandalone = fs.existsSync(standaloneServerPath);

console.log(`🚀 [LUMO] Starting (Standalone: ${hasStandalone ? '✅' : '❌'}) on port ${PORT}`);

let standaloneProcess = null;
let isReady = false;
let standalonePort = null;
let startupTimeout = null;

// Find available port
const findPort = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.listen(port, () => {
    const p = server.address().port;
    server.close(() => resolve(p));
  });
  server.on('error', () => resolve(findPort(port + 1)));
});

// Check if standalone is responding
const checkStandaloneReady = async () => {
  if (!standalonePort) return false;
  
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: standalonePort,
      path: '/health',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

// Start standalone if available
const startStandalone = async () => {
  if (!hasStandalone) {
    console.log('⚠️ [LUMO] No standalone build found, serving fallback only');
    return;
  }
  
  standalonePort = await findPort(PORT + 1);
  console.log(`🎯 [LUMO] Starting standalone on port ${standalonePort}`);
  
  standaloneProcess = spawn('node', [standaloneServerPath], {
    env: { ...process.env, PORT: standalonePort },
    stdio: 'pipe'
  });
  
  // Enhanced startup detection
  standaloneProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`📝 [STANDALONE] ${output.trim()}`);
    
    if (output.includes('ready') || output.includes('started') || output.includes(`listening on`)) {
      isReady = true;
      console.log('✅ [LUMO] Standalone ready');
      if (startupTimeout) {
        clearTimeout(startupTimeout);
        startupTimeout = null;
      }
    }
  });
  
  standaloneProcess.stderr.on('data', (data) => {
    console.error(`❌ [STANDALONE] ${data.toString().trim()}`);
  });
  
  standaloneProcess.on('error', (error) => {
    console.error('❌ [LUMO] Standalone process error:', error.message);
    isReady = false;
  });
  
  standaloneProcess.on('exit', (code) => {
    console.log(`📴 [LUMO] Standalone process exited with code ${code}`);
    isReady = false;
  });
  
  // Fallback: Mark as ready after 5 seconds if no explicit ready signal
  startupTimeout = setTimeout(async () => {
    console.log('⏰ [LUMO] Checking standalone readiness...');
    const ready = await checkStandaloneReady();
    if (ready) {
      isReady = true;
      console.log('✅ [LUMO] Standalone ready (health check passed)');
    } else {
      console.log('⚠️ [LUMO] Standalone not responding, will keep trying');
    }
  }, 5000);
};

// Proxy function with better error handling
const proxy = async (req, res) => {
  if (!standalonePort) {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Service Unavailable</h1><p>Standalone server not available</p></body></html>');
    return;
  }
  
  // Double-check readiness
  if (!isReady) {
    const ready = await checkStandaloneReady();
    if (ready) {
      isReady = true;
      console.log('✅ [LUMO] Standalone ready (late detection)');
    }
  }
  
  if (!isReady) {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<html><body style="font-family:Arial;text-align:center;margin:40px;"><h1>🚀 LUMO</h1><p>Starting standalone server...</p><script>setTimeout(()=>location.reload(),2000)</script></body></html>');
    return;
  }
  
  const proxyReq = http.request({
    hostname: 'localhost',
    port: standalonePort,
    path: req.url,
    method: req.method,
    headers: req.headers,
    timeout: 10000
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (error) => {
    console.error('🔗 [PROXY] Error:', error.message);
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Service Error</h1><p>Could not connect to application server</p></body></html>');
  });
  
  proxyReq.on('timeout', () => {
    console.error('🔗 [PROXY] Timeout');
    proxyReq.destroy();
    res.writeHead(504, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Gateway Timeout</h1><p>Application server took too long to respond</p></body></html>');
  });
  
  req.pipe(proxyReq);
};

// Health endpoints
const health = {
  '/health': () => JSON.stringify({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    standalone: {
      available: hasStandalone,
      ready: isReady,
      port: standalonePort
    }
  }),
  '/api/health': () => JSON.stringify({ 
    status: 'healthy', 
    server: 'lumo-optimized',
    standalone: isReady 
  })
};

// Main server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health routes
  if (health[url.pathname]) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(health[url.pathname]());
    return;
  }
  
  // Proxy to standalone
  if (hasStandalone) {
    await proxy(req, res);
    return;
  }
  
  // Fallback when no standalone
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><head><title>LUMO</title></head><body style="font-family:Arial;text-align:center;margin:40px;"><h1>🚀 LUMO</h1><p>No standalone build available. Please run: npm run build</p></body></html>');
});

// Start server
const start = async () => {
  try {
    await startStandalone();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ [LUMO] Server running at http://0.0.0.0:${PORT}`);
      if (hasStandalone) {
        console.log(`🔗 [LUMO] Proxying to standalone on port ${standalonePort}`);
      }
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ [LUMO] Port ${PORT} in use. Try: PORT=8081 node lumo-optimized-server.js`);
        process.exit(1);
      } else {
        console.error(`❌ [LUMO] Server error:`, err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ [LUMO] Failed to start:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = () => {
  console.log('📴 [LUMO] Shutting down...');
  if (startupTimeout) clearTimeout(startupTimeout);
  if (standaloneProcess) {
    standaloneProcess.kill('SIGTERM');
    setTimeout(() => {
      if (standaloneProcess && !standaloneProcess.killed) {
        standaloneProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start(); 