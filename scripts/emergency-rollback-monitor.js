#!/usr/bin/env node

const https = require('https');

const CHOREO_URL = 'https://lumo-1615540597-7595685744.choreoapis.dev';
const CHECK_INTERVAL = 10000; // 10 seconds
let checkCount = 0;
let startTime = Date.now();

console.log('🚨 EMERGENCY ROLLBACK MONITORING');
console.log('================================');
console.log(`🎯 Target: ${CHOREO_URL}`);
console.log(`⏰ Started: ${new Date().toLocaleTimeString()}`);
console.log('📊 Checking rollback deployment status...\n');

function checkHealth() {
  checkCount++;
  const options = {
    hostname: new URL(CHOREO_URL).hostname,
    path: '/api/health',
    method: 'GET',
    timeout: 15000
  };

  const startCheck = Date.now();
  
  const req = https.request(options, (res) => {
    const responseTime = Date.now() - startCheck;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (res.statusCode === 200) {
      console.log(`✅ Check ${checkCount} (${elapsed}s): HEALTHY - ${responseTime}ms`);
      console.log('🎉 ROLLBACK SUCCESSFUL! Service restored.');
      process.exit(0);
    } else {
      console.log(`❌ Check ${checkCount} (${elapsed}s): Status ${res.statusCode} - ${responseTime}ms`);
    }
  });

  req.on('error', (err) => {
    const responseTime = Date.now() - startCheck;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (err.code === 'ENOTFOUND') {
      console.log(`🔄 Check ${checkCount} (${elapsed}s): Deployment in progress... - ${responseTime}ms`);
    } else {
      console.log(`❌ Check ${checkCount} (${elapsed}s): ${err.message} - ${responseTime}ms`);
    }
  });

  req.setTimeout(15000, () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`⏱️ Check ${checkCount} (${elapsed}s): Timeout (15s)`);
    req.destroy();
  });

  req.end();
}

// Initial check
checkHealth();

// Set up interval checks
const interval = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  
  if (elapsed > 600) { // 10 minutes max
    console.log('\n⚠️ Rollback taking longer than expected. Check Choreo console.');
    clearInterval(interval);
    process.exit(1);
  }
  
  checkHealth();
}, CHECK_INTERVAL);

console.log('Press Ctrl+C to stop monitoring...'); 