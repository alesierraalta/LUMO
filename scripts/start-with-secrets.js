#!/usr/bin/env node

/**
 * Startup script for Choreo deployment
 * Loads secrets from mounted files and starts the Next.js application
 */

const { spawn } = require('child_process');
const path = require('path');

// Import and run secret loading
require('./load-secrets');

console.log('[STARTUP] Secrets loaded, starting Next.js application...');

// Start the Next.js application
const serverPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
const app = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

app.on('error', (error) => {
  console.error('[STARTUP] Failed to start application:', error);
  process.exit(1);
});

app.on('exit', (code) => {
  console.log(`[STARTUP] Application exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[STARTUP] Received SIGTERM, shutting down gracefully...');
  app.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[STARTUP] Received SIGINT, shutting down gracefully...');
  app.kill('SIGINT');
}); 