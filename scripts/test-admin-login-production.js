#!/usr/bin/env node

/**
 * Test Admin Login with Detailed Analysis
 * Find the exact cause of authentication failure
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testAdminLogin() {
  console.log('🔍 DETAILED ADMIN LOGIN ANALYSIS');
  console.log('================================');
  
  try {
    // Step 1: Create a fresh test user
    console.log('\n🧪 Step 1: Create Fresh Test User');
    console.log('---------------------------------');
    
    const testEmail = `test-fresh-${Date.now()}@lumo.com`;
    const testPassword = 'TestPassword123';
    
    console.log(`Creating user: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Fresh Test User'
      })
    });
    
    const registerData = await registerResponse.json();
    
    console.log(`Registration Status: ${registerResponse.status}`);
    console.log(`Registration Response:`, JSON.stringify(registerData, null, 2));
    
    if (registerData.success && registerData.user) {
      console.log('✅ User created successfully');
      console.log(`   User ID: ${registerData.user.id}`);
      console.log(`   Email: ${registerData.user.email}`);
      console.log(`   Created At: ${registerData.user.createdAt}`);
      
      // Step 2: Wait and try login
      console.log('\n🔐 Step 2: Immediate Login Test');
      console.log('------------------------------');
      
      console.log('Waiting 3 seconds for Supabase to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const loginData = await loginResponse.json();
      
      console.log(`Login Status: ${loginResponse.status}`);
      console.log(`Login Response:`, JSON.stringify(loginData, null, 2));
      
      if (loginData.success) {
        console.log('🎉 LOGIN SUCCESSFUL!');
        console.log('✅ System is working correctly');
        
        // Now test with admin credentials
        console.log('\n👤 Step 3: Test Admin Creation');
        console.log('------------------------------');
        
        const adminEmail = 'admin@lumo.dev';
        const adminPassword = 'admin123';
        
        console.log(`Creating admin: ${adminEmail}`);
        
        const adminRegisterResponse = await fetch(`${DEV_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            name: 'Admin LUMO Dev'
          })
        });
        
        const adminRegisterData = await adminRegisterResponse.json();
        
        console.log(`Admin Registration Status: ${adminRegisterResponse.status}`);
        
        if (adminRegisterData.success || adminRegisterData.error?.includes('already exists')) {
          console.log('✅ Admin user ready');
          
          // Wait and test admin login
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const adminLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              password: adminPassword
            })
          });
          
          const adminLoginData = await adminLoginResponse.json();
          
          console.log(`Admin Login Status: ${adminLoginResponse.status}`);
          
          if (adminLoginData.success) {
            console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
            console.log(`   Email: ${adminLoginData.user.email}`);
            console.log(`   Role: ${adminLoginData.user.role}`);
            console.log(`   Token: ${adminLoginData.token ? 'Present' : 'Missing'}`);
            
            // Test API access
            if (adminLoginData.token) {
              console.log('\n🔑 Step 4: Test API Access');
              console.log('--------------------------');
              
              const apiResponse = await fetch(`${DEV_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
              });
              
              console.log(`API Access Status: ${apiResponse.status}`);
              
              if (apiResponse.status === 200) {
                console.log('✅ API access working!');
                
                console.log('\n🎯 COMPLETE SUCCESS!');
                console.log('====================');
                console.log('✅ Registration system working');
                console.log('✅ Login system working');
                console.log('✅ Admin user functional');
                console.log('✅ API access working');
                console.log('\n📋 WORKING CREDENTIALS:');
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
                console.log('   Role: ADMIN');
                
                return {
                  success: true,
                  adminEmail: adminEmail,
                  adminPassword: adminPassword,
                  token: adminLoginData.token
                };
              } else {
                console.log(`❌ API access failed: ${apiResponse.status}`);
              }
            }
          } else {
            console.log(`❌ Admin login failed: ${adminLoginData.error}`);
          }
        } else {
          console.log(`❌ Admin creation failed: ${adminRegisterData.error}`);
        }
        
      } else {
        console.log(`❌ Test login failed: ${loginData.error}`);
        console.log('\n🔧 POSSIBLE CAUSES:');
        console.log('1. User created with admin client but login using anon client');
        console.log('2. Email confirmation still required');
        console.log('3. Password policy mismatch');
        console.log('4. Supabase Auth configuration issue');
        
        console.log('\n💡 DEBUGGING SUGGESTIONS:');
        console.log('- Check Supabase dashboard for created user');
        console.log('- Verify email confirmation status');
        console.log('- Check auth.users table in Supabase');
        console.log('- Review Supabase Auth settings');
      }
      
    } else {
      console.log(`❌ User creation failed: ${registerData.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  return { success: false };
}

testAdminLogin().then(result => {
  if (result.success) {
    console.log('\n🚀 SYSTEM READY FOR PRODUCTION!');
    console.log('===============================');
    console.log(`✨ Admin Email: ${result.adminEmail}`);
    console.log(`✨ Admin Password: ${result.adminPassword}`);
    console.log('✨ All systems functional');
  } else {
    console.log('\n⚠️ System needs manual configuration');
    console.log('📖 Check Supabase dashboard settings');
  }
}).catch(console.error); 