// LUMO Ultra-Compact Server - Maximum efficiency, minimal code
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

const PORT = process.env.PORT || 8080;
const standaloneServerPath = '.next/standalone/server.js';
const hasStandalone = fs.existsSync(standaloneServerPath);

console.log(`🚀 [LUMO] Starting (Standalone: ${hasStandalone ? '✅' : '❌'})`);

let standaloneProcess = null;
let isReady = false;
let standalonePort = null;

// Find available port
const findPort = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.listen(port, () => {
    const p = server.address().port;
    server.close(() => resolve(p));
  });
  server.on('error', () => resolve(findPort(port + 1)));
});

// Start standalone if available
const startStandalone = async () => {
  if (!hasStandalone) return;
  standalonePort = await findPort(PORT + 1);
  console.log(`🎯 [LUMO] Starting standalone on port ${standalonePort}`);
  
  standaloneProcess = spawn('node', [standaloneServerPath], {
    env: { ...process.env, PORT: standalonePort },
    stdio: 'pipe'
  });
  
  standaloneProcess.stdout.on('data', (data) => {
    if (data.toString().includes('ready')) {
      isReady = true;
      console.log('✅ [LUMO] Standalone ready');
    }
  });
  
  standaloneProcess.on('error', () => isReady = false);
};

// Proxy function
const proxy = (req, res) => {
  if (!standalonePort) {
    res.writeHead(503);
    res.end('Service unavailable');
    return;
  }
  
  const proxyReq = http.request({
    hostname: 'localhost',
    port: standalonePort,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', () => {
    res.writeHead(503);
    res.end('Service unavailable');
  });
  
  req.pipe(proxyReq);
};

// Health endpoints
const health = {
  '/health': () => JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
  '/api/health': () => JSON.stringify({ status: 'healthy', server: 'lumo-ultra-compact' })
};

// Main server
const server = http.createServer((req, res) => {
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
  if (hasStandalone && isReady) {
    proxy(req, res);
    return;
  }
  
  // Fallback
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><head><title>LUMO</title></head><body style="font-family:Arial;text-align:center;margin:40px;"><h1>🚀 LUMO</h1><p>Starting...</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>');
});

// Start server
const start = async () => {
  try {
    await startStandalone();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ [LUMO] Server running at http://0.0.0.0:${PORT}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ [LUMO] Port ${PORT} in use. Try: PORT=8081 node lumo-ultra-compact-server.js`);
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
  if (standaloneProcess) standaloneProcess.kill('SIGTERM');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start(); 