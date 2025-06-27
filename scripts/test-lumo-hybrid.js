#!/usr/bin/env node

/**
 * TEST LUMO HYBRID SERVER
 * Script para probar el servidor híbrido LUMO con la aplicación real
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 PRUEBA DEL SERVIDOR LUMO HÍBRIDO');
console.log('====================================');

const TEST_PORT = process.env.TEST_PORT || 3001;
const TEST_TIMEOUT = 45000; // 45 segundos para Next.js

// Test endpoints to verify
const testEndpoints = [
  { path: '/health', expected: 'lumo-hybrid', description: 'Health check' },
  { path: '/api/health', expected: 'LUMO hybrid server operational', description: 'API health' },
  { path: '/', expected: 'LUMO Inventory System', description: 'Home page' },
  { path: '/dashboard', expected: null, description: 'Dashboard (Next.js)', expectNextJS: true },
  { path: '/inventory', expected: null, description: 'Inventory (Next.js)', expectNextJS: true },
  { path: '/login', expected: null, description: 'Login (Next.js)', expectNextJS: true }
];

let serverProcess = null;
let testsPassed = 0;
let testsTotal = testEndpoints.length;

// Function to make HTTP request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Function to test endpoint
async function testEndpoint(endpoint) {
  try {
    console.log(`🔍 Testing ${endpoint.path} - ${endpoint.description}...`);
    
    const response = await makeRequest(endpoint.path);
    
    if (response.statusCode === 200) {
      if (endpoint.expected && response.data.includes(endpoint.expected)) {
        console.log(`   ✅ PASS: Found expected content "${endpoint.expected}"`);
        return true;
      } else if (endpoint.expectNextJS && response.data.includes('<!DOCTYPE html>')) {
        console.log(`   ✅ PASS: Next.js page loaded successfully`);
        return true;
      } else if (!endpoint.expected && !endpoint.expectNextJS) {
        console.log(`   ✅ PASS: Endpoint responded with status 200`);
        return true;
      } else {
        console.log(`   ⚠️ PARTIAL: Status 200 but content verification failed`);
        console.log(`   📄 Response preview: ${response.data.substring(0, 100)}...`);
        return false;
      }
    } else {
      console.log(`   ❌ FAIL: Status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Function to wait for server
function waitForServer(timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkServer = async () => {
      try {
        await makeRequest('/health');
        console.log('✅ Server is responding');
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(checkServer, 2000);
        }
      }
    };
    
    checkServer();
  });
}

// Main test function
async function runTests() {
  try {
    // Check if lumo-hybrid-server.js exists
    const serverPath = path.join(process.cwd(), 'lumo-hybrid-server.js');
    if (!fs.existsSync(serverPath)) {
      throw new Error('lumo-hybrid-server.js not found');
    }

    console.log('🚀 Starting LUMO hybrid server...');
    console.log(`📁 Server path: ${serverPath}`);
    console.log(`🌐 Test port: ${TEST_PORT}`);
    
    // Start server
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: TEST_PORT },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log(`📋 [SERVER] ${output.trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.log(`⚠️ [SERVER ERROR] ${data.toString().trim()}`);
    });

    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await waitForServer(TEST_TIMEOUT);

    // Wait a bit more for Next.js to initialize
    console.log('⏳ Waiting for Next.js initialization...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('\n🧪 Running endpoint tests...');
    console.log('=============================');

    // Run tests
    for (const endpoint of testEndpoints) {
      const passed = await testEndpoint(endpoint);
      if (passed) {
        testsPassed++;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    }

    // Results
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${testsPassed}/${testsTotal} (${Math.round(testsPassed/testsTotal*100)}%)`);
    console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`);

    if (testsPassed === testsTotal) {
      console.log('\n🎉 ALL TESTS PASSED! LUMO hybrid server is working correctly!');
      console.log('✅ Ready for Choreo deployment');
    } else if (testsPassed >= testsTotal * 0.8) {
      console.log('\n⚠️ MOSTLY WORKING! Some tests failed but core functionality is operational');
      console.log('🔧 Minor adjustments may be needed');
    } else {
      console.log('\n❌ MULTIPLE FAILURES! Server needs attention');
      console.log('🔧 Review server logs and configuration');
    }

    // Server info
    console.log('\n🔧 SERVER INFORMATION');
    console.log('=====================');
    
    try {
      const healthResponse = await makeRequest('/health');
      const healthData = JSON.parse(healthResponse.data);
      console.log(`📊 Server: ${healthData.server}`);
      console.log(`⚡ Next.js Ready: ${healthData.nextjs ? '✅' : '❌'}`);
      console.log(`🎯 Standalone: ${healthData.standalone ? '✅' : '❌'}`);
      console.log(`⏱️ Uptime: ${Math.round(healthData.uptime)}s`);
      console.log(`💾 Memory: ${Math.round(healthData.memory.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      console.log('❌ Could not get server info');
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    if (serverProcess) {
      console.log('\n🧹 Cleaning up...');
      serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          console.log('🔨 Force killing server...');
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n📴 Test interrupted by user');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📴 Test terminated');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Run tests
runTests(); 