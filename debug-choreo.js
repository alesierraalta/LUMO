/**
 * Choreo Deployment Debug Script
 * 
 * This script helps diagnose 505 HTTP Version Not Supported errors
 * by testing different server configurations and HTTP protocols.
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

console.log('🔍 CHOREO DEBUG SCRIPT - Diagnosing 505 Error');
console.log('================================================');

// Test basic HTTP server
function testBasicServer() {
  return new Promise((resolve) => {
    console.log('\n1️⃣ Testing basic HTTP server...');
    
    const server = http.createServer((req, res) => {
      console.log(`📥 Request: ${req.method} ${req.url}`);
      console.log(`📡 HTTP Version: ${req.httpVersion}`);
      console.log(`🔗 Headers:`, req.headers);
      
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Connection': 'close'
      });
      
      res.end(JSON.stringify({
        status: 'debug-server-working',
        httpVersion: req.httpVersion,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      }, null, 2));
    });
    
    const port = process.env.PORT || 8080;
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Debug server running on port ${port}`);
      console.log(`🌍 Test URL: http://0.0.0.0:${port}/debug`);
      
      // Keep server running for 30 seconds
      setTimeout(() => {
        server.close(() => {
          console.log('🔚 Debug server stopped');
          resolve();
        });
      }, 30000);
    });
    
    server.on('error', (error) => {
      console.error('❌ Debug server error:', error);
      resolve();
    });
  });
}

// Test HTTP/1.1 vs HTTP/2 compatibility
function testHTTPVersions() {
  console.log('\n2️⃣ Testing HTTP version compatibility...');
  
  const testRequests = [
    { version: '1.0', description: 'HTTP/1.0' },
    { version: '1.1', description: 'HTTP/1.1' },
  ];
  
  testRequests.forEach(({ version, description }) => {
    console.log(`🧪 Testing ${description}...`);
    
    try {
      const options = {
        hostname: 'localhost',
        port: process.env.PORT || 8080,
        path: '/debug',
        method: 'GET',
        headers: {
          'User-Agent': `Debug-Client-HTTP/${version}`,
          'Accept': 'application/json',
          'Connection': 'close'
        }
      };
      
      const req = http.request(options, (res) => {
        console.log(`✅ ${description} Response: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📡 Server HTTP Version: ${res.httpVersion}`);
      });
      
      req.on('error', (error) => {
        console.error(`❌ ${description} Error:`, error.message);
      });
      
      req.setTimeout(5000, () => {
        console.error(`⏰ ${description} Timeout`);
        req.destroy();
      });
      
      req.end();
    } catch (error) {
      console.error(`💥 ${description} Exception:`, error.message);
    }
  });
}

// Check environment and configuration
function checkEnvironment() {
  console.log('\n3️⃣ Environment Check...');
  console.log(`🐧 Platform: ${process.platform}`);
  console.log(`📊 Node Version: ${process.version}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`🚪 Port: ${process.env.PORT || '8080 (default)'}`);
  console.log(`🏠 Working Directory: ${process.cwd()}`);
  
  // Check for Next.js files
  const fs = require('fs');
  const path = require('path');
  
  const importantFiles = [
    '.next/build-manifest.json',
    '.next/app-build-manifest.json',
    '.next/standalone/server.js',
    'next.config.ts',
    'package.json'
  ];
  
  console.log('\n📁 File Check:');
  importantFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
}

// Test Choreo-specific issues
function testChoreoIssues() {
  console.log('\n4️⃣ Choreo-specific tests...');
  
  // Test if running in container
  const fs = require('fs');
  
  try {
    if (fs.existsSync('/.dockerenv')) {
      console.log('🐳 Running in Docker container');
    } else {
      console.log('💻 Running on host system');
    }
  } catch (error) {
    console.log('❓ Cannot determine container status');
  }
  
  // Test network binding
  console.log('🔗 Testing network binding on 0.0.0.0...');
  
  const testServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Choreo binding test successful');
  });
  
  testServer.listen(0, '0.0.0.0', () => {
    const address = testServer.address();
    console.log(`✅ Successfully bound to 0.0.0.0:${address.port}`);
    testServer.close();
  });
  
  testServer.on('error', (error) => {
    console.error('❌ Network binding error:', error.message);
  });
}

// Main execution
async function runDebug() {
  console.log(`🚀 Starting debug at ${new Date().toISOString()}`);
  
  checkEnvironment();
  testChoreoIssues();
  testHTTPVersions();
  
  // Only run server test if in debug mode
  if (process.argv.includes('--server-test')) {
    await testBasicServer();
  } else {
    console.log('\n💡 To run server test, use: node debug-choreo.js --server-test');
  }
  
  console.log('\n🎯 Debug complete!');
  console.log('\n📋 Next steps to fix 505 error:');
  console.log('1. Ensure Choreo is using start:choreo script');
  console.log('2. Check that port 8080 is properly configured');
  console.log('3. Verify HTTP/1.1 compatibility');
  console.log('4. Test health endpoint: /health or /api/health');
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, exiting debug...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, exiting debug...');
  process.exit(0);
});

// Run the debug
runDebug().catch(error => {
  console.error('💥 Debug script error:', error);
  process.exit(1);
}); 