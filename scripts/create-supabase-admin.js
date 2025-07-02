#!/usr/bin/env node

/**
 * Create Admin User using Supabase Auth
 * This will create the admin user properly in Supabase
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function createSupabaseAdmin() {
  console.log('🔧 CREATING ADMIN USER WITH SUPABASE AUTH');
  console.log('==========================================');
  
  const adminEmail = 'alesierraalta@gmail.com';
  const adminPassword = 'admin123';
  
  try {
    // Test the new registration system
    console.log('📝 Creating admin with Supabase Auth...');
    
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
    console.log(`Error: ${registerData.error || 'None'}`);
    
    if (registerData.success) {
      console.log('✅ Admin user created with Supabase Auth!');
      console.log(`   User ID: ${registerData.user.id}`);
      console.log(`   Email: ${registerData.user.email}`);
      console.log(`   Role: ${registerData.user.role}`);
      
      // Wait a moment for Supabase to process
      console.log('\n⏳ Waiting for Supabase to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now test login
      console.log('\n🔐 Testing admin login...');
      
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
        console.log(`   User: ${loginData.user.email}`);
        console.log(`   Role: ${loginData.user.role}`);
        console.log(`   Token: ${loginData.token ? 'Present' : 'Missing'}`);
        
        return { success: true, token: loginData.token };
      } else {
        console.log(`❌ Login failed: ${loginData.error}`);
      }
      
    } else {
      console.log(`❌ Registration failed: ${registerData.error}`);
      
      // If user already exists, try login
      if (registerData.error?.includes('already') || registerData.error?.includes('exists')) {
        console.log('\n🔐 User might exist, trying login...');
        
        const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword
          })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginData.success) {
          console.log('✅ Admin already exists and can login!');
          return { success: true, token: loginData.token };
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return { success: false };
}

createSupabaseAdmin().then(result => {
  if (result.success) {
    console.log('\n🎯 ADMIN SETUP COMPLETE!');
    console.log('✅ Ready to run user flow tests');
    console.log('🧪 Run: node scripts/test-production-user-flow-complete.js');
  } else {
    console.log('\n⚠️ Admin setup failed - check Supabase configuration');
  }
}).catch(console.error); 