#!/usr/bin/env node

/**
 * Setup Admin User in Development Environment
 * Create and configure admin user with proper credentials
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function setupDevAdmin() {
  console.log('🚀 SETTING UP ADMIN USER IN DEVELOPMENT');
  console.log('========================================');
  console.log(`🌐 DEV Environment: ${DEV_URL}`);
  
  const adminEmail = 'alesierraalta@gmail.com';
  const adminPassword = 'admin123';
  
  console.log(`👤 Admin Email: ${adminEmail}`);
  console.log(`🔑 Admin Password: ${adminPassword}`);
  
  try {
    // Step 1: Health Check
    console.log('\n📊 STEP 1: Health Check');
    console.log('----------------------');
    
    const healthResponse = await fetch(`${DEV_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log(`✅ Health Status: ${healthResponse.status}`);
    console.log(`✅ Service: ${healthData.service}`);
    console.log(`✅ DEV server is running!`);
    
    // Step 2: Try to register admin user
    console.log('\n👤 STEP 2: Register Admin User');
    console.log('------------------------------');
    
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
    
    if (registerData.success) {
      console.log(`✅ Admin user created successfully!`);
      console.log(`   User ID: ${registerData.user.id}`);
      console.log(`   Email: ${registerData.user.email}`);
      console.log(`   Role: ${registerData.user.role}`);
      console.log(`   Active: ${registerData.user.isActive}`);
    } else {
      console.log(`⚠️ Registration response: ${registerData.error}`);
      if (registerData.error?.includes('already exists') || registerData.error?.includes('User already exists')) {
        console.log(`✅ Admin user already exists - this is good!`);
      }
    }
    
    // Step 3: Test admin login
    console.log('\n🔐 STEP 3: Test Admin Login');
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
      console.log(`✅ ADMIN LOGIN SUCCESSFUL!`);
      console.log(`   User: ${loginData.user.email}`);
      console.log(`   Role: ${loginData.user.role}`);
      console.log(`   Token: ${loginData.token ? 'Present' : 'Missing'}`);
      
      // Step 4: Test admin API access
      if (loginData.token) {
        console.log('\n🔑 STEP 4: Test Admin API Access');
        console.log('--------------------------------');
        
        const apiResponse = await fetch(`${DEV_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        console.log(`API Access Status: ${apiResponse.status}`);
        
        if (apiResponse.status === 200) {
          const users = await apiResponse.json();
          console.log(`✅ Admin API access working! Found ${Array.isArray(users) ? users.length : 'N/A'} users`);
          
          // Step 5: Test role management
          console.log('\n👥 STEP 5: Test Role Management');
          console.log('-------------------------------');
          
          const rolesResponse = await fetch(`${DEV_URL}/api/roles`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
          });
          
          console.log(`Roles API Status: ${rolesResponse.status}`);
          
          if (rolesResponse.status === 200) {
            const roles = await rolesResponse.json();
            console.log(`✅ Role management working! Found ${Array.isArray(roles) ? roles.length : 'N/A'} roles`);
            
            console.log('\n🎉 DEVELOPMENT ADMIN SETUP COMPLETE!');
            console.log('====================================');
            console.log('✅ Admin user configured');
            console.log('✅ Login working');
            console.log('✅ API access working');
            console.log('✅ Role management working');
            console.log('\n🚀 Ready to run complete user flow tests!');
            
            return true;
          } else {
            console.log(`❌ Role management failed: ${rolesResponse.status}`);
          }
        } else {
          console.log(`❌ Admin API access failed: ${apiResponse.status}`);
        }
      }
    } else {
      console.log(`❌ ADMIN LOGIN FAILED: ${loginData.error}`);
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('- Check if email confirmation is required');
      console.log('- Verify password meets requirements');
      console.log('- Check Supabase auth configuration');
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  }
  
  return false;
}

// Run setup
setupDevAdmin().then(success => {
  if (success) {
    console.log('\n✨ Setup completed successfully!');
    console.log('🧪 You can now run: node scripts/test-production-user-flow-complete.js');
  } else {
    console.log('\n⚠️ Setup needs attention - check the logs above');
  }
}).catch(console.error); 