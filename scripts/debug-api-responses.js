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

async function debugApiResponses() {
  console.log('🔍 Debugging API Responses\n');

  // Get auth token
  const token = await getAuthToken();
  console.log('Using token:', token ? 'Valid token obtained' : 'No token');

  // Test inventory search with no results
  try {
    console.log('\n1. Testing inventory search with no results...');
    const response = await fetch(`${BASE_URL}/api/inventory?search=nonexistent`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Items type:', typeof data.items);
    console.log('Items value:', data.items);
    console.log('Is array?', Array.isArray(data.items));
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test inventory search with results
  try {
    console.log('2. Testing inventory search with potential results...');
    const response = await fetch(`${BASE_URL}/api/inventory?search=test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Items type:', typeof data.items);
    console.log('Items value:', data.items);
    console.log('Is array?', Array.isArray(data.items));
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test roles endpoint
  try {
    console.log('3. Testing roles endpoint...');
    const response = await fetch(`${BASE_URL}/api/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 404) {
      console.log('Status: 404 - Roles endpoint does not exist');
    } else {
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test health endpoint
  try {
    console.log('4. Testing health endpoint...');
    const response = await fetch(`${BASE_URL}/api/health`);
    
    if (response.status === 404) {
      console.log('Status: 404 - Health endpoint has issues');
    } else {
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

debugApiResponses().catch(console.error); 