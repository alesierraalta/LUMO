const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugUserIdMismatch() {
  console.log('🔍 Debugging User ID Mismatch Issue...\n');

  try {
    // Step 1: Check what users exist in database
    console.log('📝 Step 1: Check existing users in database');
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    
    if (!usersResponse.ok) {
      throw new Error(`Get users failed: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    console.log('✅ Users in database:');
    if (usersData.users) {
      usersData.users.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    }

    // Step 2: Test login and see what user ID is returned
    console.log('\n📝 Step 2: Test login with admin credentials');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('🔍 Login response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success || !loginData.token) {
      throw new Error('Login did not return valid token');
    }

    // Step 3: Decode the JWT token to see what user ID it contains
    console.log('\n📝 Step 3: Decode JWT token');
    const token = loginData.token;
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('🔍 JWT payload:', JSON.stringify(payload, null, 2));

    // Step 4: Check if the JWT user ID exists in database
    console.log('\n📝 Step 4: Check if JWT user ID exists in database');
    const jwtUserId = payload.userId;
    const userExists = usersData.users?.find(user => user.id === jwtUserId);
    
    if (userExists) {
      console.log('✅ JWT user ID matches database user:', userExists.email);
    } else {
      console.log('❌ JWT user ID NOT FOUND in database!');
      console.log(`   JWT User ID: ${jwtUserId}`);
      console.log('   Available User IDs:');
      usersData.users?.forEach(user => {
        console.log(`     - ${user.id} (${user.email})`);
      });
    }

    // Step 5: Try to find the correct user ID for the email
    console.log('\n📝 Step 5: Find correct user for email alesierraalta@gmail.com');
    const correctUser = usersData.users?.find(user => user.email === 'alesierraalta@gmail.com');
    
    if (correctUser) {
      console.log('✅ Found correct user in database:');
      console.log(`   Database User ID: ${correctUser.id}`);
      console.log(`   JWT User ID:      ${jwtUserId}`);
      console.log(`   Match: ${correctUser.id === jwtUserId ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ User alesierraalta@gmail.com not found in database');
    }

    return {
      success: true,
      jwtUserId,
      databaseUserId: correctUser?.id,
      mismatch: correctUser?.id !== jwtUserId,
      users: usersData.users
    };

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return { 
      success: false, 
      message: `Debug error: ${error.message}` 
    };
  }
}

// Run the debug
debugUserIdMismatch().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG RESULT:');
  console.log('Success:', result.success);
  if (result.mismatch) {
    console.log('❌ USER ID MISMATCH DETECTED!');
    console.log(`JWT User ID: ${result.jwtUserId}`);
    console.log(`Database User ID: ${result.databaseUserId}`);
    console.log('🔧 This needs to be fixed in the login endpoint');
  } else if (result.success) {
    console.log('✅ User IDs match correctly');
  }
  console.log('='.repeat(50));
  
  process.exit(result.success ? 0 : 1);
}); 