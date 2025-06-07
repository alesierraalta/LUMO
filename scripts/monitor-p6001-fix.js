#!/usr/bin/env node

const https = require('https');

const CHOREO_URL = 'https://lumo-1615540597-7b97f4ff94.choreoapis.dev';
const CHECK_INTERVAL = 5000; // 5 seconds

console.log('🎯 P6001 FIX MONITORING');
console.log('======================');
console.log(`🎯 Target: ${CHOREO_URL}`);
console.log(`⏰ Started: ${new Date().toLocaleTimeString()}`);
console.log('📊 Monitoring for P6001 fix effectiveness...\\n');

let checkCount = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'P6001-Fix-Monitor/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('TIMEOUT')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLogin() {
  try {
    const result = await makeRequest(`${CHOREO_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: 'pradasamuel1@gmail.com',
        password: 'admin123'
      }
    });

    const timestamp = new Date().toLocaleTimeString();
    
    if (result.status === 200 && result.data.success) {
      console.log(`\\n🎉 [${timestamp}] LOGIN SUCCESS!`);
      console.log(`✅ User: ${result.data.user.email}`);
      console.log(`✅ Role: ${result.data.user.role}`);
      console.log(`✅ Redirect: ${result.data.redirectUrl}`);
      console.log('\\n🔥 P6001 FIX CONFIRMED WORKING! 🔥');
      return true;
    } else if (result.status === 401) {
      console.log(`❌ [${timestamp}] Authentication failed - ${result.data.error}`);
    } else {
      console.log(`⚠️ [${timestamp}] Unexpected response: ${result.status} - ${JSON.stringify(result.data)}`);
    }
    
    return false;
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`💥 [${timestamp}] Login test error: ${error.message}`);
    return false;
  }
}

async function checkHealth() {
  try {
    const result = await makeRequest(`${CHOREO_URL}/api/health`);
    const timestamp = new Date().toLocaleTimeString();
    
    if (result.status === 200) {
      console.log(`✅ [${timestamp}] Health check OK`);
      return true;
    } else {
      console.log(`❌ [${timestamp}] Health check failed: ${result.status}`);
      return false;
    }
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`💥 [${timestamp}] Health check error: ${error.message}`);
    return false;
  }
}

async function monitor() {
  checkCount++;
  
  console.log(`\\n📋 Check #${checkCount} - ${new Date().toLocaleTimeString()}`);
  
  // Test health first
  const healthOk = await checkHealth();
  
  if (healthOk) {
    // Test login to see if P6001 is fixed
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
      console.log('\\n🎯 MONITORING COMPLETE - P6001 FIX SUCCESSFUL!');
      process.exit(0);
    }
  }
  
  // Continue monitoring
  setTimeout(monitor, CHECK_INTERVAL);
}

// Start monitoring
console.log('🚀 Starting P6001 fix monitoring...');
monitor(); 

const https = require('https');

const CHOREO_URL = 'https://lumo-1615540597-7b97f4ff94.choreoapis.dev';
const CHECK_INTERVAL = 5000; // 5 seconds

console.log('🎯 P6001 FIX MONITORING');
console.log('======================');
console.log(`🎯 Target: ${CHOREO_URL}`);
console.log(`⏰ Started: ${new Date().toLocaleTimeString()}`);
console.log('📊 Monitoring for P6001 fix effectiveness...\\n');

let checkCount = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'P6001-Fix-Monitor/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('TIMEOUT')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLogin() {
  try {
    const result = await makeRequest(`${CHOREO_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: 'pradasamuel1@gmail.com',
        password: 'admin123'
      }
    });

    const timestamp = new Date().toLocaleTimeString();
    
    if (result.status === 200 && result.data.success) {
      console.log(`\\n🎉 [${timestamp}] LOGIN SUCCESS!`);
      console.log(`✅ User: ${result.data.user.email}`);
      console.log(`✅ Role: ${result.data.user.role}`);
      console.log(`✅ Redirect: ${result.data.redirectUrl}`);
      console.log('\\n🔥 P6001 FIX CONFIRMED WORKING! 🔥');
      return true;
    } else if (result.status === 401) {
      console.log(`❌ [${timestamp}] Authentication failed - ${result.data.error}`);
    } else {
      console.log(`⚠️ [${timestamp}] Unexpected response: ${result.status} - ${JSON.stringify(result.data)}`);
    }
    
    return false;
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`💥 [${timestamp}] Login test error: ${error.message}`);
    return false;
  }
}

async function checkHealth() {
  try {
    const result = await makeRequest(`${CHOREO_URL}/api/health`);
    const timestamp = new Date().toLocaleTimeString();
    
    if (result.status === 200) {
      console.log(`✅ [${timestamp}] Health check OK`);
      return true;
    } else {
      console.log(`❌ [${timestamp}] Health check failed: ${result.status}`);
      return false;
    }
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`💥 [${timestamp}] Health check error: ${error.message}`);
    return false;
  }
}

async function monitor() {
  checkCount++;
  
  console.log(`\\n📋 Check #${checkCount} - ${new Date().toLocaleTimeString()}`);
  
  // Test health first
  const healthOk = await checkHealth();
  
  if (healthOk) {
    // Test login to see if P6001 is fixed
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
      console.log('\\n🎯 MONITORING COMPLETE - P6001 FIX SUCCESSFUL!');
      process.exit(0);
    }
  }
  
  // Continue monitoring
  setTimeout(monitor, CHECK_INTERVAL);
}

// Start monitoring
console.log('🚀 Starting P6001 fix monitoring...');
monitor(); 
 