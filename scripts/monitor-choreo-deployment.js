#!/usr/bin/env node

/**
 * Choreo Deployment Continuous Monitor
 * Monitors deployment status until successful or timeout
 */

const https = require('https');

const PRODUCTION_URL = 'https://lumoapp.choreoapps.dev';
const HEALTH_ENDPOINT = '/api/health';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_ATTEMPTS = 20; // 10 minutes total
const TIMEOUT_MS = 15000; // 15 seconds per request

let attempt = 0;
let deploymentStartTime = Date.now();

console.log('🚀 CHOREO DEPLOYMENT MONITOR');
console.log('=============================');
console.log(`Target: ${PRODUCTION_URL}`);
console.log(`Checking every ${CHECK_INTERVAL/1000} seconds`);
console.log(`Max attempts: ${MAX_ATTEMPTS} (${(MAX_ATTEMPTS * CHECK_INTERVAL)/60000} minutes)`);
console.log(`Started at: ${new Date().toISOString()}\n`);

function checkDeployment() {
  attempt++;
  const currentTime = new Date().toISOString();
  const elapsedMinutes = ((Date.now() - deploymentStartTime) / 60000).toFixed(1);
  
  console.log(`📊 Attempt ${attempt}/${MAX_ATTEMPTS} - ${currentTime} (${elapsedMinutes}m elapsed)`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(`${PRODUCTION_URL}${HEALTH_ENDPOINT}`, { timeout: TIMEOUT_MS }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ SUCCESS! Deployment is live!`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response time: ${responseTime}ms`);
        
        try {
          const healthData = JSON.parse(data);
          console.log(`   Health data:`, JSON.stringify(healthData, null, 2));
        } catch (e) {
          console.log(`   Raw response: ${data}`);
        }
        
        console.log(`\n🎉 DEPLOYMENT SUCCESSFUL!`);
        console.log(`   Total time: ${elapsedMinutes} minutes`);
        console.log(`   Attempts: ${attempt}`);
        console.log(`   URL: ${PRODUCTION_URL}`);
        
        resolve({ success: true, responseTime, data });
      });
    });

    req.on('timeout', () => {
      console.log(`   ⏱️  Timeout (${TIMEOUT_MS}ms) - Still deploying...`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.on('error', (err) => {
      if (err.code === 'ENOTFOUND') {
        console.log(`   🌐 DNS resolution failed - Service not ready`);
      } else if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
        console.log(`   🔄 Connection refused - Container starting...`);
      } else {
        console.log(`   ❌ Error: ${err.message}`);
      }
      resolve({ success: false, error: err.message });
    });
  });
}

async function monitorDeployment() {
  while (attempt < MAX_ATTEMPTS) {
    const result = await checkDeployment();
    
    if (result.success) {
      // Deployment successful!
      process.exit(0);
    }
    
    if (attempt >= MAX_ATTEMPTS) {
      console.log(`\n❌ DEPLOYMENT TIMEOUT`);
      console.log(`   Max attempts reached (${MAX_ATTEMPTS})`);
      console.log(`   Total time: ${((Date.now() - deploymentStartTime) / 60000).toFixed(1)} minutes`);
      console.log(`\n🔍 Troubleshooting:`);
      console.log(`   1. Check Choreo console for deployment logs`);
      console.log(`   2. Verify container build completed successfully`);
      console.log(`   3. Check resource allocation and health checks`);
      console.log(`   4. Review choreo.yaml configuration`);
      process.exit(1);
    }
    
    // Wait before next attempt
    console.log(`   ⏳ Waiting ${CHECK_INTERVAL/1000}s for next check...\n`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Monitoring stopped by user`);
  console.log(`   Attempts made: ${attempt}`);
  console.log(`   Time elapsed: ${((Date.now() - deploymentStartTime) / 60000).toFixed(1)} minutes`);
  process.exit(0);
});

// Start monitoring
monitorDeployment().catch(console.error); 