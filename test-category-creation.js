const fetch = require('node-fetch');

async function testCategoryCreation() {
  console.log('🧪 Testing Category Creation API...');
  
  try {
    // First, try to login to get a valid token
    console.log('1. Attempting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Now test category creation
    console.log('2. Testing category creation...');
    const categoryResponse = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Category ' + Date.now(),
        description: 'Test category description'
      })
    });
    
    const categoryData = await categoryResponse.json();
    console.log('Category creation response:', categoryData);
    
    if (categoryData.success) {
      console.log('✅ Category creation successful!');
      console.log('Category details:', categoryData.category);
    } else {
      console.error('❌ Category creation failed:', categoryData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testCategoryCreation(); 