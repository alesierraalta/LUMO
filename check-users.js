const fetch = require('node-fetch');

async function checkUsers() {
  console.log('🔍 Checking users in database...');
  
  try {
    // Login to get token
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
    console.log('Login successful, user ID from JWT:', loginData.user.id);
    
    // Get all users
    const usersResponse = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    const usersData = await usersResponse.json();
    console.log('Users API response:', usersData);
    
    if (usersData.success && usersData.users) {
      console.log('📊 Users found in database:');
      usersData.users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
      
      // Check if the JWT user ID exists in the database
      const jwtUserId = loginData.user.id;
      const userExists = usersData.users.find(u => u.id === jwtUserId);
      
      if (userExists) {
        console.log('✅ JWT user ID exists in database');
      } else {
        console.log('❌ JWT user ID NOT found in database!');
        console.log('JWT user ID:', jwtUserId);
        console.log('Database user IDs:', usersData.users.map(u => u.id));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers(); 