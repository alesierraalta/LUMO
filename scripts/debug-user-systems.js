#!/usr/bin/env node

/**
 * Debug User Systems - Legacy vs Supabase Auth
 * Understand why there's a mismatch between systems
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function debugUserSystems() {
  console.log('🔍 DEBUGGING USER SYSTEMS');
  console.log('=========================');
  
  const adminEmail = 'alesierraalta@gmail.com';
  const adminPassword = 'admin123';
  
  try {
    // Step 1: Check health
    console.log('📊 Step 1: Health Check');
    const healthResponse = await fetch(`${DEV_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ Health: ${healthResponse.status} - ${healthData.service}`);
    
    // Step 2: Try to get users (this will show us the current system)
    console.log('\n👥 Step 2: Check Users API');
    
    // First try without auth
    const usersResponse = await fetch(`${DEV_URL}/api/users`);
    console.log(`Users API Status (no auth): ${usersResponse.status}`);
    
    if (usersResponse.status === 200) {
      const users = await usersResponse.json();
      console.log(`Found ${Array.isArray(users) ? users.length : 'N/A'} users`);
      
      if (Array.isArray(users) && users.length > 0) {
        console.log('Sample user structure:', JSON.stringify(users[0], null, 2));
        
        // Look for admin user
        const adminUser = users.find(u => u.email === adminEmail);
        if (adminUser) {
          console.log('✅ Admin user found in legacy system:', JSON.stringify(adminUser, null, 2));
        } else {
          console.log('❌ Admin user NOT found in legacy system');
        }
      }
    } else {
      console.log('❌ Users API requires authentication');
    }
    
    // Step 3: Try legacy login (if it exists)
    console.log('\n🔐 Step 3: Test Current Login API');
    
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
    console.log(`Response:`, JSON.stringify(loginData, null, 2));
    
    // Step 4: Try registration to see current system
    console.log('\n📝 Step 4: Test Registration API');
    
    const testEmail = 'test@example.com';
    const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'test123',
        name: 'Test User'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log(`Registration Status: ${registerResponse.status}`);
    console.log(`Response:`, JSON.stringify(registerData, null, 2));
    
    // Step 5: Check if we have both systems
    console.log('\n🔍 Step 5: System Analysis');
    
    if (registerResponse.status === 400 && registerData.error?.includes('already exists')) {
      console.log('📋 ANALYSIS: Using LEGACY database system');
      console.log('- Users stored in local database');
      console.log('- Passwords hashed with bcrypt/similar');
      console.log('- Registration checks local database');
    } else if (registerData.success || registerData.error?.includes('Supabase')) {
      console.log('📋 ANALYSIS: Using SUPABASE AUTH system');
      console.log('- Users stored in Supabase auth.users');
      console.log('- Passwords managed by Supabase');
      console.log('- Registration uses Supabase signUp');
    } else {
      console.log('📋 ANALYSIS: System unclear - mixed or broken');
    }
    
    // Step 6: Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (loginData.success) {
      console.log('✅ Login working - system is consistent');
    } else {
      console.log('❌ Login failing - systems are inconsistent');
      console.log('🔧 SOLUTIONS:');
      console.log('1. Delete legacy user and create with Supabase');
      console.log('2. Update login API to match registration system');
      console.log('3. Migrate legacy users to Supabase Auth');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugUserSystems().catch(console.error); 