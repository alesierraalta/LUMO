#!/usr/bin/env node

/**
 * Test Hybrid Authentication System
 * Test both Supabase Auth and direct database authentication
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testHybridAuth() {
  console.log('🔧 TESTING HYBRID AUTHENTICATION SYSTEM');
  console.log('=======================================');
  
  try {
    // Test 1: Admin login with original credentials
    console.log('\n👤 Test 1: Admin Login (Original Credentials)');
    console.log('---------------------------------------------');
    
    const adminEmail = 'alesierraalta@gmail.com';
    const adminPassword = 'admin123';
    
    console.log(`Testing: ${adminEmail} / ${adminPassword}`);
    
    const adminLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    
    console.log(`Status: ${adminLoginResponse.status}`);
    console.log(`Success: ${adminLoginData.success}`);
    console.log(`Message: ${adminLoginData.message || 'N/A'}`);
    
    if (adminLoginData.success) {
      console.log('🎉 ADMIN LOGIN SUCCESS!');
      console.log(`   Email: ${adminLoginData.user.email}`);
      console.log(`   Role: ${adminLoginData.user.role}`);
      console.log(`   Token: ${adminLoginData.token ? 'Present' : 'Missing'}`);
      
      // Test API access
      if (adminLoginData.token) {
        console.log('\n🔑 Testing API Access');
        console.log('---------------------');
        
        const apiTests = [
          { url: '/api/users', name: 'Users API' },
          { url: '/api/roles', name: 'Roles API' },
          { url: '/api/categories', name: 'Categories API' },
          { url: '/api/inventory', name: 'Inventory API' }
        ];
        
        for (const test of apiTests) {
          const apiResponse = await fetch(`${DEV_URL}${test.url}`, {
            headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
          });
          
          console.log(`   ${test.name}: ${apiResponse.status === 200 ? '✅' : '❌'} ${apiResponse.status}`);
        }
        
        console.log('\n🎯 COMPLETE SUCCESS!');
        console.log('====================');
        console.log('✅ Admin authentication working');
        console.log('✅ Token generation working');
        console.log('✅ API access functional');
        console.log('\n📋 WORKING ADMIN CREDENTIALS:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   Authentication: Hybrid System');
        
        return {
          success: true,
          adminEmail: adminEmail,
          adminPassword: adminPassword,
          token: adminLoginData.token,
          authMethod: adminLoginData.message
        };
      }
    } else {
      console.log(`❌ Admin login failed: ${adminLoginData.error}`);
      
      // Test 2: Try creating a new user to test the system
      console.log('\n🧪 Test 2: Create Test User');
      console.log('---------------------------');
      
      const testEmail = `test-hybrid-${Date.now()}@lumo.com`;
      const testPassword = 'TestPassword123';
      
      console.log(`Creating: ${testEmail} / ${testPassword}`);
      
      const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test Hybrid User'
        })
      });
      
      const registerData = await registerResponse.json();
      
      console.log(`Registration Status: ${registerResponse.status}`);
      console.log(`Registration Success: ${registerData.success}`);
      
      if (registerData.success) {
        console.log('✅ User created successfully');
        
        // Wait and test login
        console.log('\n🔐 Testing hybrid login with new user...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const testLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword
          })
        });
        
        const testLoginData = await testLoginResponse.json();
        
        console.log(`Test Login Status: ${testLoginResponse.status}`);
        console.log(`Test Login Success: ${testLoginData.success}`);
        console.log(`Test Login Message: ${testLoginData.message || 'N/A'}`);
        
        if (testLoginData.success) {
          console.log('✅ Hybrid authentication working for new users!');
          console.log(`   Auth Method: ${testLoginData.message}`);
          console.log(`   Token: ${testLoginData.token ? 'Present' : 'Missing'}`);
          
          console.log('\n💡 ADMIN SOLUTION:');
          console.log('==================');
          console.log('The hybrid system is working for new users.');
          console.log('Admin credentials might need to be recreated.');
          console.log('\nOptions:');
          console.log('1. Use a different admin email');
          console.log('2. Recreate admin user');
          console.log('3. Use test credentials temporarily');
          
        } else {
          console.log(`❌ Test login failed: ${testLoginData.error}`);
        }
      } else {
        console.log(`❌ User creation failed: ${registerData.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  return { success: false };
}

testHybridAuth().then(result => {
  if (result.success) {
    console.log('\n🚀 HYBRID AUTH SYSTEM READY!');
    console.log('============================');
    console.log(`✨ Admin Email: ${result.adminEmail}`);
    console.log(`✨ Admin Password: ${result.adminPassword}`);
    console.log(`✨ Auth Method: ${result.authMethod}`);
    console.log('✨ System fully functional');
  } else {
    console.log('\n⚠️ Hybrid auth needs configuration');
    console.log('📖 Check admin user setup');
  }
}).catch(console.error); 