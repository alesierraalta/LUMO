const { spawn } = require('child_process');
const http = require('http');

console.log('🔍 INFINITE LOOP DEBUGGING - FINAL ATTEMPT');
console.log('==========================================');

// Function to test if server is responding
function testServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', () => {
      resolve({ status: 'ERROR', data: 'Connection failed' });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', data: 'Request timeout' });
    });
  });
}

// Function to monitor API requests for a specific duration
function monitorApiRequests(duration = 30000) {
  return new Promise((resolve) => {
    console.log(`🔍 Monitoring API requests for ${duration/1000} seconds...`);
    
    let requestCount = 0;
    let supabaseMeCount = 0;
    const requests = [];
    const startTime = Date.now();
    
    // Intercept console.log to capture server logs
    const originalLog = console.log;
    console.log = (...args) => {
      const logMessage = args.join(' ');
      
      // Check for API requests
      if (logMessage.includes('GET /api/auth/supabase-me')) {
        supabaseMeCount++;
        requestCount++;
        requests.push({
          timestamp: new Date().toISOString(),
          message: logMessage
        });
      }
      
      // Pass through to original console.log
      originalLog(...args);
    };
    
    setTimeout(() => {
      console.log = originalLog; // Restore original console.log
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log('\n📊 MONITORING RESULTS:');
      console.log('======================');
      console.log(`⏱️  Duration: ${totalTime}ms (${totalTime/1000}s)`);
      console.log(`📈 Total API requests: ${requestCount}`);
      console.log(`🎯 /api/auth/supabase-me requests: ${supabaseMeCount}`);
      console.log(`📊 Requests per second: ${(requestCount / (totalTime/1000)).toFixed(2)}`);
      
      if (requests.length > 0) {
        console.log('\n🔍 REQUEST DETAILS:');
        requests.slice(0, 5).forEach((req, index) => {
          console.log(`${index + 1}. ${req.timestamp} - ${req.message}`);
        });
        if (requests.length > 5) {
          console.log(`... and ${requests.length - 5} more requests`);
        }
      }
      
      resolve({
        duration: totalTime,
        totalRequests: requestCount,
        supabaseMeRequests: supabaseMeCount,
        requestsPerSecond: requestCount / (totalTime/1000),
        hasInfiniteLoop: supabaseMeCount > 10 // More than 10 requests in 30s indicates a loop
      });
    }, duration);
  });
}

async function main() {
  try {
    // Step 1: Test if server is already running
    console.log('🔍 Step 1: Testing if server is already running...');
    const serverTest = await testServer();
    
    if (serverTest.status === 200) {
      console.log('✅ Server is already running on port 3000');
      console.log('📊 Server response:', serverTest.data);
      
      // Monitor for infinite loop
      const monitorResult = await monitorApiRequests(30000);
      
      if (monitorResult.hasInfiniteLoop) {
        console.log('\n❌ INFINITE LOOP DETECTED!');
        console.log(`🔥 ${monitorResult.supabaseMeRequests} requests to /api/auth/supabase-me in ${monitorResult.duration/1000}s`);
        console.log('🔍 This confirms the infinite loop is NOT from auth context or API endpoint');
        console.log('🔍 The source must be something else - possibly:');
        console.log('   - Browser tab making requests');
        console.log('   - Middleware causing redirects');
        console.log('   - Another component or service');
        console.log('   - React Strict Mode double-rendering');
      } else {
        console.log('\n✅ NO INFINITE LOOP DETECTED!');
        console.log('🎉 The fixes appear to be working');
      }
      
    } else {
      console.log('❌ Server is not running or not responding');
      console.log('📊 Status:', serverTest.status, 'Data:', serverTest.data);
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

main(); 