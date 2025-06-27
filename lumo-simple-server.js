// LUMO Simple Server - Direct standalone execution
const { spawn } = require('child_process');
const fs = require('fs');

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
const standaloneServerPath = '.next/standalone/server.js';
const hasStandalone = fs.existsSync(standaloneServerPath);

console.log(`🚀 [LUMO] Starting LUMO on port ${PORT}`);

if (!hasStandalone) {
  console.error('❌ [LUMO] No standalone build found. Please run: npm run build');
  process.exit(1);
}

console.log(`🎯 [LUMO] Starting standalone server...`);

// Start standalone server directly
const standaloneProcess = spawn('node', [standaloneServerPath], {
  env: { ...process.env, PORT: PORT },
  stdio: 'inherit' // This will show all output directly
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

// Graceful shutdown
const shutdown = () => {
  console.log('📴 [LUMO] Shutting down...');
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

console.log(`✅ [LUMO] Server starting at http://0.0.0.0:${PORT}`); 