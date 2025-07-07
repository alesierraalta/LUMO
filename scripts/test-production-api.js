const fetch = require('node-fetch');

const PROD_BASE_URL = 'https://lumo-woad.vercel.app';

async function testProductionAPI() {
  console.log('🧪 Testing LUMO Production API\n');
  console.log(`Base URL: ${PROD_BASE_URL}\n`);

  const tests = [
    {
      name: 'Health Endpoint',
      url: `${PROD_BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Login Endpoint',
      url: `${PROD_BASE_URL}/api/auth/login`,
      method: 'POST',
      body: {
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      }
    },
    {
      name: 'Categories Endpoint',
      url: `${PROD_BASE_URL}/api/categories`,
      method: 'GET'
    },
    {
      name: 'Users Endpoint',
      url: `${PROD_BASE_URL}/api/users`,
      method: 'GET'
    },
    {
      name: 'Inventory Endpoint',
      url: `${PROD_BASE_URL}/api/inventory`,
      method: 'GET'
    },
    {
      name: 'Locations Endpoint',
      url: `${PROD_BASE_URL}/api/locations`,
      method: 'GET'
    },
    {
      name: 'Roles Endpoint',
      url: `${PROD_BASE_URL}/api/roles`,
      method: 'GET'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const status = response.status;
      
      if (status === 200 || status === 201) {
        console.log(`✅ ${test.name}: ${status} OK`);
        successCount++;
        
        // Show response for login to get token
        if (test.name === 'Login Endpoint') {
          const data = await response.json();
          if (data.success && data.token) {
            console.log(`   🔑 Token received: ${data.token.substring(0, 20)}...`);
          }
        }
      } else if (status === 404) {
        console.log(`❌ ${test.name}: ${status} NOT FOUND`);
      } else if (status === 401) {
        console.log(`🔐 ${test.name}: ${status} UNAUTHORIZED (expected for some endpoints)`);
      } else {
        console.log(`⚠️  ${test.name}: ${status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`💥 ${test.name}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }

  console.log(`\n📊 Summary: ${successCount}/${totalTests} tests successful`);
  const percentage = ((successCount / totalTests) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${percentage}%`);
  
  if (successCount === totalTests) {
    console.log('🎉 ALL PRODUCTION APIs ARE WORKING!');
  } else {
    console.log('⚠️  Some production APIs have issues');
  }
}

testProductionAPI().catch(console.error); 