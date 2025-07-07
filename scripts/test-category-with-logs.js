const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testCategoryWithLogs() {
  console.log('🔍 Testing Category Creation with Error Logging...\n');

  try {
    // Login first
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, user ID:', loginData.user.id);

    // Create category and log the response
    console.log('\n📝 Creating test category...');
    const categoryData = {
      name: 'Test Category ' + Date.now(),
      description: 'Test description'
    };

    console.log('Request data:', JSON.stringify(categoryData, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });

    console.log('Response status:', createResponse.status);
    console.log('Response headers:', Object.fromEntries(createResponse.headers.entries()));
    
    const responseText = await createResponse.text();
    console.log('Raw response:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.category === null) {
        console.log('\n❌ ISSUE IDENTIFIED: Category creation returned null');
        console.log('This suggests an error occurred in db.category.create() but was caught and returned null');
        console.log('Check the server console logs for the actual error details.');
      }
    } catch (parseError) {
      console.log('Failed to parse response as JSON:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCategoryWithLogs(); 