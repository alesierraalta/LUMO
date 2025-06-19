#!/usr/bin/env node

/**
 * LUMO - Debug Infinite Loop Issue
 * Monitor server logs to see if disabling API call stops the loop
 */

const { spawn } = require('child_process');

console.log('🔧 LUMO - Debugging Infinite Loop');
console.log('==================================');
console.log('Testing with API call disabled...');

// Start the development server
const serverProcess = spawn('npm', ['run', 'dev:fixed'], {
  stdio: 'pipe',
  shell: true
});

let requestCount = 0;
let startTime = Date.now();

// Monitor server output
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Count API requests
  const apiMatches = output.match(/GET \/api\/auth\/supabase-me/g);
  if (apiMatches) {
    requestCount += apiMatches.length;
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

// Monitor for 30 seconds
setTimeout(() => {
  const elapsed = (Date.now() - startTime) / 1000;
  const requestsPerSecond = requestCount / elapsed;
  
  console.log('\n📊 DEBUG RESULTS:');
  console.log(`   Duration: ${elapsed.toFixed(1)}s`);
  console.log(`   Total API requests: ${requestCount}`);
  console.log(`   Requests per second: ${requestsPerSecond.toFixed(2)}`);
  
  if (requestCount === 0) {
    console.log('✅ SUCCESS: No API requests detected - Loop fixed!');
  } else if (requestsPerSecond > 1) {
    console.log('❌ LOOP STILL EXISTS: Too many requests detected');
  } else {
    console.log('✅ IMPROVEMENT: Reduced request frequency');
  }
  
  serverProcess.kill();
  process.exit(0);
}, 30000);

console.log('⏱️ Monitoring for 30 seconds...'); 