const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function getAuthToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    } else {
      console.log('Login failed, using mock token');
      return 'test-token';
    }
  } catch (error) {
    console.log('Login error, using mock token:', error.message);
    return 'test-token';
  }
}

async function testRolesAPI() {
  console.log('🔍 Testing Roles API\n');

  const token = await getAuthToken();
  console.log('Using token:', token ? 'Valid token obtained' : 'No token');

  try {
    console.log('1. Testing roles endpoint...');
    const response = await fetch(`${BASE_URL}/api/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.roles) {
        console.log('✅ Roles API working correctly');
        console.log('Number of roles:', data.roles.length);
      } else if (data.success && data.roles === null) {
        console.log('⚠️ Roles API returns null - likely database schema issue');
      } else {
        console.log('❌ Unexpected response format');
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Error response:', errorData);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n==================================================\n');

  // Test creating a role
  try {
    console.log('2. Testing role creation...');
    const response = await fetch(`${BASE_URL}/api/roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'TEST_ROLE',
        description: 'Test role for API testing'
      })
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('✅ Role creation working');
    } else {
      const errorData = await response.text();
      console.log('❌ Role creation failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Role creation request failed:', error.message);
  }
}

testRolesAPI(); 