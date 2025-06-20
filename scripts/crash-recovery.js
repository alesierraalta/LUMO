#!/usr/bin/env node

/**
 * Crash Recovery System for LUMO Choreo Deployment
 */

const { spawn } = require('child_process');
const fs = require('fs');

class CrashRecoveryManager {
  constructor() {
    this.restartCount = 0;
    this.maxRestarts = 3;
    this.serverProcess = null;
    this.isShuttingDown = false;
  }

  startServer() {
    console.log(`🚀 Starting server (attempt ${this.restartCount + 1}/${this.maxRestarts + 1})...`);
    
    this.serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    this.serverProcess.on('exit', (code, signal) => {
      if (this.isShuttingDown) return;
      
      console.log(`❌ Server exited with code ${code}, signal ${signal}`);
      
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`🔄 Attempting restart (${this.restartCount}/${this.maxRestarts})...`);
        setTimeout(() => this.startServer(), 5000);
      } else {
        console.error('💀 Max restart attempts reached. Server is unstable.');
        process.exit(1);
      }
    });
    
    this.serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
    });
    
    // Reset restart count on successful run (after 2 minutes)
    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.restartCount = 0;
        console.log('✅ Server running successfully - restart count reset');
      }
    }, 120000);
  }

  gracefulShutdown() {
    console.log('🛑 Initiating graceful shutdown...');
    this.isShuttingDown = true;
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Force kill after 30 seconds
      setTimeout(() => {
        if (!this.serverProcess.killed) {
          console.log('⚠️  Force killing server process');
          this.serverProcess.kill('SIGKILL');
        }
      }, 30000);
    }
  }
}

const recoveryManager = new CrashRecoveryManager();

// Handle shutdown signals
process.on('SIGTERM', () => recoveryManager.gracefulShutdown());
process.on('SIGINT', () => recoveryManager.gracefulShutdown());

// Start the server with crash recovery
recoveryManager.startServer();

module.exports = CrashRecoveryManager;
