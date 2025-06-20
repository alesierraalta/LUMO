#!/usr/bin/env node

/**
 * Memory Usage Monitor for LUMO Choreo Deployment
 */

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function monitorMemory() {
  const usage = process.memoryUsage();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Memory Usage:`);
  console.log(`  RSS: ${formatBytes(usage.rss)}`);
  console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  External: ${formatBytes(usage.external)}`);
  console.log(`  Array Buffers: ${formatBytes(usage.arrayBuffers)}`);
  
  // Alert if memory usage is high
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 4096) { // Alert if over 4GB
    console.warn(`⚠️  HIGH MEMORY USAGE: ${formatBytes(usage.heapUsed)}`);
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🗑️  Garbage collection triggered');
  }
}

// Monitor every 30 seconds
setInterval(monitorMemory, 30000);

// Initial check
monitorMemory();

console.log('📊 Memory monitoring started (30s intervals)');
