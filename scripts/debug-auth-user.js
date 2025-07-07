const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugAuthUser() {
  console.log('🔍 Debugging Authentication User\n');

  // Test login
  try {
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });
    
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login response:', JSON.stringify(loginData, null, 2));
      
      if (loginData.success && loginData.token) {
        console.log('✅ Login successful, token obtained');
        
        // Now test if we can get user info
        console.log('\n2. Testing user info with token...');
        const userResponse = await fetch(`${BASE_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        console.log('Users Status:', userResponse.status);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Users response:', JSON.stringify(userData, null, 2));
          
          if (userData.success && userData.users && userData.users.length > 0) {
            // Find the current user
            const currentUser = userData.users.find(u => u.email === 'alesierraalta@gmail.com');
            if (currentUser) {
              console.log('✅ Found current user in database:');
              console.log('   ID:', currentUser.id);
              console.log('   Email:', currentUser.email);
              console.log('   Role:', currentUser.role);
              
              // Test category creation with this specific user
              console.log('\n3. Testing category creation with authenticated user...');
              const categoryResponse = await fetch(`${BASE_URL}/api/categories`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${loginData.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: 'Debug Test Category ' + Date.now(),
                  description: 'Debug test category'
                })
              });
              
              console.log('Category Creation Status:', categoryResponse.status);
              const categoryData = await categoryResponse.json();
              console.log('Category Creation Response:', JSON.stringify(categoryData, null, 2));
              
            } else {
              console.log('❌ Current user not found in users list');
            }
          } else {
            console.log('❌ No users found or invalid response');
          }
        } else {
          const errorText = await userResponse.text();
          console.log('❌ Users request failed:', errorText);
        }
      } else {
        console.log('❌ Login failed or invalid response');
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login request failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugAuthUser(); 