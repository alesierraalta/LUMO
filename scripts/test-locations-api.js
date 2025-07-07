const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLocationsAPI() {
  console.log('🧪 Testing Locations API...');
  
  try {
    // Test GET locations
    console.log('\n1. Testing GET /api/locations...');
    const getResult = await makeRequest('GET', '/api/locations');
    console.log(`Status: ${getResult.status}`);
    console.log('Response:', JSON.stringify(getResult.data, null, 2));
    
    // Test POST location
    console.log('\n2. Testing POST /api/locations...');
    const testLocation = {
      name: "Tienda Principal",
      description: "Tienda ubicada en el centro comercial, piso 2",
      isActive: true
    };
    
    const postResult = await makeRequest('POST', '/api/locations', testLocation);
    console.log(`Status: ${postResult.status}`);
    console.log('Response:', JSON.stringify(postResult.data, null, 2));
    
    // Test GET again to see if location was created
    console.log('\n3. Testing GET /api/locations again...');
    const getResult2 = await makeRequest('GET', '/api/locations');
    console.log(`Status: ${getResult2.status}`);
    console.log('Response:', JSON.stringify(getResult2.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLocationsAPI(); 