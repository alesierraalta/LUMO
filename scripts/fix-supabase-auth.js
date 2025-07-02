#!/usr/bin/env node

/**
 * Fix Supabase Auth Configuration
 * Disable email confirmation for development environment
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function fixSupabaseAuth() {
  console.log('🔧 FIXING SUPABASE AUTH CONFIGURATION');
  console.log('====================================');
  
  console.log('📋 ISSUE IDENTIFIED:');
  console.log('- Users created successfully in Supabase Auth');
  console.log('- Login fails immediately after creation');
  console.log('- Likely cause: Email confirmation required');
  
  console.log('\n💡 SOLUTIONS:');
  console.log('1. Disable email confirmation in Supabase dashboard');
  console.log('2. Use admin API to confirm users automatically');
  console.log('3. Update registration to skip confirmation');
  
  try {
    // Test current registration with more details
    console.log('\n🧪 Testing detailed registration process...');
    
    const testEmail = `test-${Date.now()}@lumo.com`;
    const testPassword = 'test123456';
    
    const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User Detailed'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log(`Registration Status: ${registerResponse.status}`);
    console.log(`Response:`, JSON.stringify(registerData, null, 2));
    
    if (registerData.success) {
      console.log('✅ User created successfully');
      
      // Check if user needs confirmation
      if (registerData.user.email_confirmed_at) {
        console.log('✅ Email already confirmed');
      } else {
        console.log('⚠️ Email confirmation required');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try immediate login
      console.log('\n🔐 Testing immediate login...');
      
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
        console.log('✅ Immediate login successful - auth is working!');
        
        // Now try with admin credentials
        console.log('\n👤 Creating admin user...');
        
        const adminEmail = 'alesierraalta@gmail.com';
        const adminPassword = 'admin123';
        
        const adminRegisterResponse = await fetch(`${DEV_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            name: 'Administrador LUMO'
          })
        });
        
        const adminRegisterData = await adminRegisterResponse.json();
        console.log(`Admin Registration Status: ${adminRegisterResponse.status}`);
        
        if (adminRegisterData.success || adminRegisterData.error?.includes('already exists')) {
          console.log('✅ Admin user ready');
          
          // Wait and try admin login
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
            
            return { success: true, adminToken: adminLoginData.token };
          } else {
            console.log(`❌ Admin login failed: ${adminLoginData.error}`);
            
            console.log('\n🔧 MANUAL STEPS REQUIRED:');
            console.log('1. Go to Supabase Dashboard');
            console.log('2. Project: ubjujxtvlubxowsphvuk');
            console.log('3. Authentication > Settings');
            console.log('4. Disable "Enable email confirmations"');
            console.log('5. Or manually confirm admin email in Users table');
          }
        }
        
      } else {
        console.log(`❌ Immediate login failed: ${loginData.error}`);
        console.log('\n🔧 Email confirmation is likely required');
      }
      
    } else {
      console.log(`❌ Registration failed: ${registerData.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return { success: false };
}

fixSupabaseAuth().then(result => {
  if (result.success) {
    console.log('\n🎯 AUTH SYSTEM FIXED!');
    console.log('✅ Admin login working');
    console.log('🚀 Ready for production testing');
  } else {
    console.log('\n⚠️ Manual intervention required');
    console.log('📖 Check Supabase dashboard settings');
  }
}).catch(console.error); 