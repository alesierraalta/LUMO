#!/usr/bin/env node

/**
 * LUMO ULTRA-OPTIMIZED STARTUP
 * Minimal code, maximum efficiency, 100% functionality
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 LUMO Ultra-Optimized Startup');
console.log('================================');

const currentDir = process.cwd();
const optimizedServerPath = path.join(currentDir, 'lumo-optimized-server.js');
const emergencyServerPath = path.join(currentDir, 'emergency-standalone-server.js');

// Check for optimized server
const hasOptimizedServer = fs.existsSync(optimizedServerPath);
const hasEmergencyServer = fs.existsSync(emergencyServerPath);

console.log(`🔍 Optimized server: ${hasOptimizedServer ? '✅' : '❌'}`);
console.log(`🔍 Emergency server: ${hasEmergencyServer ? '✅' : '❌'}`);

// Function to start server
function startServer(serverPath, description) {
  console.log(`🚀 ${description}`);
  
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  serverProcess.on('error', (error) => {
    console.error(`❌ Server error: ${error.message}`);
    process.exit(1);
  });
  
  // Graceful shutdown
  const shutdown = () => {
    console.log('📴 Shutting down...');
    serverProcess.kill('SIGTERM');
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Ultra-simple startup logic
if (hasOptimizedServer) {
  startServer(optimizedServerPath, 'Starting LUMO optimized server (ultra-efficient)');
} else if (hasEmergencyServer) {
  startServer(emergencyServerPath, 'Starting emergency server (fallback)');
} else {
  console.error('❌ No servers available');
  process.exit(1);
} 