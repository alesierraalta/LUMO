// LUMO Ultra-Optimized Server - Minimal, efficient, 100% functional
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOSTNAME = '0.0.0.0';

// Check for standalone server
const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
const hasStandalone = fs.existsSync(standaloneServerPath);

console.log(`🚀 [LUMO-OPT] Starting optimized server (Standalone: ${hasStandalone ? '✅' : '❌'})`);

let standaloneProcess = null;
let isStandaloneReady = false;

// Health endpoints only
const healthRoutes = {
  '/health': () => JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'lumo-optimized',
    standalone: hasStandalone,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }),
  '/api/health': () => JSON.stringify({
    status: 'healthy',
    message: 'LUMO optimized server operational',
    timestamp: new Date().toISOString()
  })
};

// Start standalone server if available
if (hasStandalone) {
  console.log('🎯 [LUMO-OPT] Starting standalone server...');
  
  standaloneProcess = spawn('node', [standaloneServerPath], {
    env: { ...process.env, PORT: PORT + 1 }, // Use different port
    stdio: 'pipe'
  });
  
  standaloneProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready') || output.includes('started')) {
      isStandaloneReady = true;
      console.log('✅ [LUMO-OPT] Standalone server ready');
    }
  });
  
  standaloneProcess.on('error', (err) => {
    console.error('❌ [LUMO-OPT] Standalone error:', err.message);
  });
}

// Proxy to standalone server
function proxyToStandalone(req, res) {
  const options = {
    hostname: 'localhost',
    port: PORT + 1,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    res.writeHead(500);
    res.end('Proxy Error');
  });
  
  req.pipe(proxyReq);
}

// Main server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health routes
  if (healthRoutes[pathname]) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(healthRoutes[pathname]());
    return;
  }
  
  // Proxy to standalone if ready
  if (hasStandalone && isStandaloneReady) {
    proxyToStandalone(req, res);
    return;
  }
  
  // Fallback for non-standalone
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(`
<!DOCTYPE html>
<html>
<head><title>LUMO</title></head>
<body style="font-family:Arial;margin:40px;text-align:center;">
  <h1>🚀 LUMO System</h1>
  <p>Initializing... Please wait.</p>
  <script>setTimeout(() => location.reload(), 5000);</script>
</body>
</html>
  `);
});

// Start server
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ [LUMO-OPT] Server running at http://${HOSTNAME}:${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('📴 [LUMO-OPT] Shutting down...');
  if (standaloneProcess) standaloneProcess.kill('SIGTERM');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); 