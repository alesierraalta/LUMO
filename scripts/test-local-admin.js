const https = require('https');
const http = require('http');

// Create HTTP agent that ignores SSL errors for local testing
const agent = new http.Agent({
  rejectUnauthorized: false
});

const BASE_URLS = ['http://localhost:3000', 'http://localhost:3001'];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, { 
      ...options, 
      agent: url.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : agent 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: jsonData, 
            headers: res.headers,
            rawData: data
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data, 
            headers: res.headers,
            rawData: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ 
        status: 0, 
        error: error.message,
        data: null 
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLocalAuthFlow() {
  console.log('🧪 Testing Local Development Server Admin Authentication...\n');
  
  let workingUrl = null;
  
  // First, find which port is working
  for (const baseUrl of BASE_URLS) {
    console.log(`🔍 Testing server at ${baseUrl}...`);
    const health = await makeRequest(`${baseUrl}/api/health`);
    
    if (health.status === 200) {
      console.log(`   ✅ Server responding at ${baseUrl}`);
      workingUrl = baseUrl;
      break;
    } else if (health.error) {
      console.log(`   ❌ Connection failed: ${health.error}`);
    } else {
      console.log(`   ❌ Server returned ${health.status}`);
    }
  }
  
  if (!workingUrl) {
    console.log('❌ No working server found. Please start the development server with npm run dev');
    return;
  }
  
  console.log(`\n🎯 Using server at: ${workingUrl}\n`);
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing Health Endpoint...');
    const health = await makeRequest(`${workingUrl}/api/health`);
    console.log(`   Status: ${health.status}`);
    if (health.status === 200) {
      console.log('   ✅ Health check successful');
      console.log(`   Response: ${JSON.stringify(health.data)}`);
    } else {
      console.log('   ❌ Health check failed');
      console.log(`   Response: ${health.rawData}`);
    }
    
    // Test 2: Test Choreo login endpoint
    console.log('\n2️⃣ Testing Choreo Login Endpoint...');
    const loginResult = await makeRequest(`${workingUrl}/api/auth/choreo-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: 'alesierraalta@gmail.com',
        password: 'test123'
      }
    });
    
    console.log(`   Login Status: ${loginResult.status}`);
    if (loginResult.status === 200) {
      console.log('   ✅ Login successful');
      console.log(`   User: ${loginResult.data.user?.email}`);
      console.log(`   Role: ${loginResult.data.user?.role}`);
      console.log(`   Is Admin: ${loginResult.data.user?.role === 'ADMIN'}`);
      console.log(`   Token: ${loginResult.data.token ? 'YES' : 'NO'}`);
      
      // Test 3: Test Choreo me endpoint with token
      if (loginResult.data.token) {
        console.log('\n3️⃣ Testing Choreo Me Endpoint...');
        const meResult = await makeRequest(`${workingUrl}/api/auth/choreo-me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.data.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log(`   Me Status: ${meResult.status}`);
        if (meResult.status === 200) {
          console.log('   ✅ Me endpoint successful');
          console.log(`   User: ${meResult.data.user?.email}`);
          console.log(`   Role: ${meResult.data.user?.role}`);
          console.log(`   Is Admin: ${meResult.data.user?.role === 'ADMIN'}`);
        } else {
          console.log('   ❌ Me endpoint failed');
          console.log(`   Error: ${JSON.stringify(meResult.data)}`);
        }
      }
    } else {
      console.log('   ❌ Login failed');
      console.log(`   Error: ${JSON.stringify(loginResult.data)}`);
      console.log(`   Raw response: ${loginResult.rawData}`);
    }
    
    // Test 4: Test regular login endpoint for comparison
    console.log('\n4️⃣ Testing Regular Login Endpoint (for comparison)...');
    const regularLoginResult = await makeRequest(`${workingUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: 'alesierraalta@gmail.com',
        password: 'test123'
      }
    });
    
    console.log(`   Regular Login Status: ${regularLoginResult.status}`);
    if (regularLoginResult.status === 200) {
      console.log('   ✅ Regular login successful');
      console.log(`   User: ${regularLoginResult.data.user?.email}`);
      console.log(`   Role: ${regularLoginResult.data.user?.role}`);
    } else {
      console.log('   ❌ Regular login failed');
      console.log(`   Error: ${JSON.stringify(regularLoginResult.data)}`);
    }
    
    // Test 5: Test regular auth endpoints
    console.log('\n5️⃣ Testing Regular Auth Debug Endpoint...');
    const debugResult = await makeRequest(`${workingUrl}/api/debug-permissions`);
    console.log(`   Debug Status: ${debugResult.status}`);
    if (debugResult.status === 200) {
      console.log('   ✅ Debug endpoint accessible');
      console.log(`   Current User: ${debugResult.data.currentUser?.email || 'None'}`);
      console.log(`   Role: ${debugResult.data.currentUser?.role || 'None'}`);
    } else {
      console.log('   ❌ Debug endpoint failed');
      console.log(`   Error: ${debugResult.rawData}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n📋 Test Summary:');
  console.log(`   - Server found at: ${workingUrl}`);
  console.log('   - Health endpoint should return 200');
  console.log('   - Choreo login should return admin role for alesierraalta@gmail.com');
  console.log('   - Choreo me endpoint should confirm admin role');
  console.log('   - Regular login should work for comparison');
  console.log('   - Debug endpoint should show current user permissions');
}

testLocalAuthFlow().catch(console.error); 