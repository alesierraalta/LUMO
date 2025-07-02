#!/usr/bin/env node

/**
 * Debug Database Structure
 * Check what's actually in the database
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function debugDatabase() {
  console.log('🔍 DEBUGGING DATABASE STRUCTURE');
  console.log('===============================');
  
  try {
    // Test 1: Check health
    console.log('\n📊 Test 1: Health Check');
    console.log('-----------------------');
    
    const healthResponse = await fetch(`${DEV_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log(`Health Status: ${healthResponse.status}`);
    console.log(`Service: ${healthData.service}`);
    console.log(`Status: ${healthData.status}`);
    
    if (healthResponse.status === 200) {
      console.log('✅ Service is running');
      
      // Test 2: Try to access users API without auth (to see error)
      console.log('\n👥 Test 2: Check Users API');
      console.log('--------------------------');
      
      const usersResponse = await fetch(`${DEV_URL}/api/users`);
      console.log(`Users API Status: ${usersResponse.status}`);
      
      if (usersResponse.status === 401) {
        console.log('✅ API properly protected (401 Unauthorized)');
      } else {
        const usersData = await usersResponse.json();
        console.log('Users API Response:', JSON.stringify(usersData, null, 2));
      }
      
      // Test 3: Check debug endpoints
      console.log('\n🔧 Test 3: Debug Endpoints');
      console.log('--------------------------');
      
      const debugEndpoints = [
        '/api/debug-auth',
        '/api/debug-supabase',
        '/api/debug-permissions'
      ];
      
      for (const endpoint of debugEndpoints) {
        try {
          const response = await fetch(`${DEV_URL}${endpoint}`);
          console.log(`${endpoint}: ${response.status}`);
          
          if (response.status === 200) {
            const data = await response.json();
            console.log(`   Data:`, JSON.stringify(data, null, 2));
          }
        } catch (error) {
          console.log(`${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      // Test 4: Try to create admin user and inspect the process
      console.log('\n👤 Test 4: Admin Creation Process');
      console.log('---------------------------------');
      
      const adminEmail = 'admin-debug@lumo.com';
      const adminPassword = 'admin123';
      
      console.log(`Creating admin: ${adminEmail}`);
      
      const adminRegisterResponse = await fetch(`${DEV_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: 'Admin Debug'
        })
      });
      
      const adminRegisterData = await adminRegisterResponse.json();
      
      console.log(`Admin Registration Status: ${adminRegisterResponse.status}`);
      console.log(`Admin Registration Response:`, JSON.stringify(adminRegisterData, null, 2));
      
      if (adminRegisterData.success || adminRegisterData.error?.includes('already exists')) {
        console.log('✅ Admin user exists or created');
        
        // Try login immediately
        console.log('\n🔐 Test 5: Debug Login Process');
        console.log('------------------------------');
        
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
        console.log(`Login Response:`, JSON.stringify(loginData, null, 2));
        
        // Test 6: Try simple password variations
        console.log('\n🔑 Test 6: Password Variations');
        console.log('------------------------------');
        
        const passwords = ['admin123', 'TestPassword123'];
        
        for (const pwd of passwords) {
          console.log(`Trying password: ${pwd}`);
          
          const testResponse = await fetch(`${DEV_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              password: pwd
            })
          });
          
          const testData = await testResponse.json();
          
          console.log(`   Status: ${testResponse.status}`);
          console.log(`   Success: ${testData.success}`);
          console.log(`   Error: ${testData.error || 'None'}`);
          
          if (testData.success) {
            console.log('🎉 FOUND WORKING PASSWORD!');
            console.log(`   Working Password: ${pwd}`);
            console.log(`   Token: ${testData.token ? 'Present' : 'Missing'}`);
            break;
          }
        }
        
        // Test 7: Check if there's a working admin in the system
        console.log('\n🧪 Test 7: Original Admin Check');
        console.log('-------------------------------');
        
        const originalAdminResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alesierraalta@gmail.com',
            password: 'admin123'
          })
        });
        
        const originalAdminData = await originalAdminResponse.json();
        
        console.log(`Original Admin Status: ${originalAdminResponse.status}`);
        console.log(`Original Admin Success: ${originalAdminData.success}`);
        console.log(`Original Admin Error: ${originalAdminData.error || 'None'}`);
        
        if (originalAdminData.success) {
          console.log('🎉 ORIGINAL ADMIN WORKING!');
          return {
            success: true,
            adminEmail: 'alesierraalta@gmail.com',
            adminPassword: 'admin123'
          };
        }
      }
      
    } else {
      console.log('❌ Service health check failed');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
  
  return { success: false };
}

debugDatabase().then(result => {
  if (result.success) {
    console.log('\n🎯 ADMIN FOUND!');
    console.log('===============');
    console.log(`✨ Email: ${result.adminEmail}`);
    console.log(`✨ Password: ${result.adminPassword}`);
  } else {
    console.log('\n⚠️ No working admin found');
    console.log('📖 Manual intervention required');
  }
}).catch(console.error); 