// LUMO Static Server - Standalone + Static Assets
const { spawn } = require('child_process');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

// PORT VALIDATION
const validatePort = (port) => {
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 0 || numPort > 65535) {
    console.log(`⚠️ [LUMO] Invalid port ${port}, using default 8080`);
    return 8080;
  }
  return numPort;
};

const PORT = validatePort(process.env.PORT || 8080);
const STANDALONE_PORT = PORT + 1; // Use next port for standalone
const standaloneServerPath = '.next/standalone/server.js';
const hasStandalone = fs.existsSync(standaloneServerPath);

console.log(`🚀 [LUMO] Starting LUMO with static assets on port ${PORT}`);

if (!hasStandalone) {
  console.error('❌ [LUMO] No standalone build found. Please run: npm run build');
  process.exit(1);
}

// Start standalone server on internal port
console.log(`🎯 [LUMO] Starting standalone server on port ${STANDALONE_PORT}...`);
const standaloneProcess = spawn('node', [standaloneServerPath], {
  env: { ...process.env, PORT: STANDALONE_PORT },
  stdio: ['pipe', 'pipe', 'pipe'] // Capture output
});

// Log standalone output with prefix
standaloneProcess.stdout.on('data', (data) => {
  console.log(`📝 [STANDALONE] ${data.toString().trim()}`);
});

standaloneProcess.stderr.on('data', (data) => {
  console.log(`⚠️ [STANDALONE] ${data.toString().trim()}`);
});

// Create Express server for static assets + proxy
const app = express();

// Serve static assets from .next/static
app.use('/_next/static', express.static(path.join(__dirname, '.next/static'), {
  maxAge: '1y',
  immutable: true
}));

// Serve public assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve favicon and other root assets
app.use('/favicon.ico', express.static(path.join(__dirname, 'public/favicon.ico')));

// Health check endpoint (direct, no proxy)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lumo-inventory',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    uptime: Math.floor(process.uptime()),
    responseTime: 0,
    staticAssets: 'enabled'
  });
});

// Wait for standalone to be ready, then proxy everything else
const waitForStandalone = async () => {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${STANDALONE_PORT}/api/health`);
      if (response.ok) {
        console.log(`✅ [LUMO] Standalone server ready on port ${STANDALONE_PORT}`);
        return true;
      }
    } catch (error) {
      // Still starting
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
};

// Setup proxy after standalone is ready
waitForStandalone().then(ready => {
  if (!ready) {
    console.error('❌ [LUMO] Standalone server failed to start');
    process.exit(1);
  }

  // Proxy all other requests to standalone
  app.use('/', createProxyMiddleware({
    target: `http://localhost:${STANDALONE_PORT}`,
    changeOrigin: true,
    logLevel: 'silent',
    onError: (err, req, res) => {
      console.error('🔥 [LUMO] Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error' });
    }
  }));

  // Start the main server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [LUMO] Server with static assets running at http://0.0.0.0:${PORT}`);
    console.log(`🔗 [LUMO] Proxying app requests to standalone on port ${STANDALONE_PORT}`);
    console.log(`📁 [LUMO] Serving static assets directly from /_next/static`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('📴 [LUMO] Shutting down...');
    server.close();
    if (standaloneProcess && !standaloneProcess.killed) {
      standaloneProcess.kill('SIGTERM');
      setTimeout(() => {
        if (standaloneProcess && !standaloneProcess.killed) {
          standaloneProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});

standaloneProcess.on('error', (error) => {
  console.error('❌ [LUMO] Standalone process error:', error.message);
  process.exit(1);
});

standaloneProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`📴 [LUMO] Standalone process killed by signal ${signal}`);
  } else {
    console.log(`📴 [LUMO] Standalone process exited with code ${code}`);
  }
  process.exit(code || 0);
}); 