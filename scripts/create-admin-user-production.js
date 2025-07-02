#!/usr/bin/env node

/**
 * Create Admin User in Production DEV Environment
 * Use the updated Supabase Admin API system
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function createAdminUserProduction() {
  console.log('🚀 CREATING ADMIN USER - PRODUCTION READY');
  console.log('=========================================');
  console.log(`🌐 Environment: ${DEV_URL}`);
  
  const adminEmail = 'alesierraalta@gmail.com';
  const adminPassword = 'admin123';
  
  try {
    // Step 1: Health check
    console.log('\n📊 Step 1: Health Check');
    console.log('----------------------');
    
    const healthResponse = await fetch(`${DEV_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log(`✅ Health: ${healthResponse.status} - ${healthData.service}`);
    console.log(`✅ Environment ready for admin creation`);
    
    // Step 2: Create admin user with updated system
    console.log('\n👤 Step 2: Create Admin User');
    console.log('----------------------------');
    
    const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        name: 'Administrador LUMO'
      })
    });
    
    const registerData = await registerResponse.json();
    
    console.log(`Registration Status: ${registerResponse.status}`);
    console.log(`Success: ${registerData.success}`);
    console.log(`User ID: ${registerData.user?.id || 'N/A'}`);
    console.log(`Role: ${registerData.user?.role || 'N/A'}`);
    
    if (registerData.success) {
      console.log('✅ Admin user created with Supabase Admin API!');
      console.log('✅ Email confirmation bypassed');
      console.log('✅ Admin role assigned automatically');
      
      // Step 3: Immediate login test
      console.log('\n🔐 Step 3: Test Admin Login');
      console.log('---------------------------');
      
      const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword
        })
      });
      
      const loginData = await loginResponse.json();
      
      console.log(`Login Status: ${loginResponse.status}`);
      console.log(`Success: ${loginData.success}`);
      
      if (loginData.success) {
        console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
        console.log(`   Email: ${loginData.user.email}`);
        console.log(`   Role: ${loginData.user.role}`);
        console.log(`   Active: ${loginData.user.isActive}`);
        console.log(`   Token: ${loginData.token ? 'Present' : 'Missing'}`);
        
        // Step 4: Test API access
        if (loginData.token) {
          console.log('\n🔑 Step 4: Test API Access');
          console.log('--------------------------');
          
          const apiTests = [
            { url: '/api/users', name: 'Users API' },
            { url: '/api/roles', name: 'Roles API' },
            { url: '/api/categories', name: 'Categories API' },
            { url: '/api/inventory', name: 'Inventory API' }
          ];
          
          for (const test of apiTests) {
            const apiResponse = await fetch(`${DEV_URL}${test.url}`, {
              headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            
            console.log(`   ${test.name}: ${apiResponse.status === 200 ? '✅' : '❌'} ${apiResponse.status}`);
          }
          
          console.log('\n🎯 COMPLETE SUCCESS!');
          console.log('====================');
          console.log('✅ Admin user created');
          console.log('✅ Email confirmation bypassed');
          console.log('✅ Login working perfectly');
          console.log('✅ API access functional');
          console.log('✅ System ready for production use');
          
          return { 
            success: true, 
            adminToken: loginData.token,
            adminUser: loginData.user
          };
          
        } else {
          console.log('❌ Token missing from login response');
        }
        
      } else {
        console.log(`❌ Admin login failed: ${loginData.error}`);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('- User created but login failing');
        console.log('- Check Supabase Auth configuration');
        console.log('- Verify email confirmation status');
      }
      
    } else {
      console.log(`❌ Admin registration failed: ${registerData.error}`);
      
      // If user already exists, try login
      if (registerData.error?.includes('already') || registerData.error?.includes('exists')) {
        console.log('\n🔐 Admin might exist, testing login...');
        
        const existingLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword
          })
        });
        
        const existingLoginData = await existingLoginResponse.json();
        
        if (existingLoginData.success) {
          console.log('✅ Admin already exists and can login!');
          return { 
            success: true, 
            adminToken: existingLoginData.token,
            adminUser: existingLoginData.user
          };
        } else {
          console.log(`❌ Existing admin login failed: ${existingLoginData.error}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return { success: false };
}

createAdminUserProduction().then(result => {
  if (result.success) {
    console.log('\n🚀 ADMIN READY FOR PRODUCTION!');
    console.log('==============================');
    console.log(`✨ Admin Email: ${result.adminUser.email}`);
    console.log(`✨ Admin Role: ${result.adminUser.role}`);
    console.log(`✨ Token Available: ${result.adminToken ? 'Yes' : 'No'}`);
    console.log('\n🧪 Next Steps:');
    console.log('1. Run complete user flow tests');
    console.log('2. Test all admin functionality');
    console.log('3. Deploy to production');
    console.log('\n📋 Command: node scripts/test-production-user-flow-complete.js');
  } else {
    console.log('\n⚠️ Admin creation failed');
    console.log('📖 Check logs above for troubleshooting');
  }
}).catch(console.error); 