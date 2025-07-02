#!/usr/bin/env node

/**
 * Test Admin Login with Detailed Logs
 * See exactly where the login process fails
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testAdminWithLogs() {
  console.log('🔍 TESTING ADMIN LOGIN WITH DETAILED LOGS');
  console.log('==========================================');
  
  try {
    // Test with admin credentials
    console.log('\n👤 Testing Admin Login');
    console.log('----------------------');
    
    const adminEmail = 'alesierraalta@gmail.com';
    const adminPassword = 'admin123';
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Expected: Should work with bcrypt hash');
    
    console.log('\n📡 Making API call...');
    
    const startTime = Date.now();
    
    const response = await fetch(`${DEV_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Test-Client'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`\n📊 Response Details:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    let responseData;
    try {
      responseData = await response.json();
      console.log(`   JSON Parse: ✅ Success`);
    } catch (parseError) {
      console.log(`   JSON Parse: ❌ Failed - ${parseError.message}`);
      const text = await response.text();
      console.log(`   Raw Response: ${text.substring(0, 200)}...`);
      return { success: false, error: 'Invalid JSON response' };
    }
    
    console.log(`\n📋 Response Data:`);
    console.log(JSON.stringify(responseData, null, 2));
    
    if (responseData.success) {
      console.log('\n🎉 SUCCESS!');
      console.log('===========');
      console.log(`✅ Email: ${responseData.user.email}`);
      console.log(`✅ Role: ${responseData.user.role}`);
      console.log(`✅ Token: ${responseData.token ? 'Present' : 'Missing'}`);
      console.log(`✅ Message: ${responseData.message}`);
      
      return {
        success: true,
        user: responseData.user,
        token: responseData.token
      };
      
    } else {
      console.log('\n❌ FAILED');
      console.log('=========');
      console.log(`Error: ${responseData.error}`);
      
      // The detailed logs should appear in the Choreo console
      console.log('\n📝 Check Choreo Logs:');
      console.log('======================');
      console.log('The login API should have logged detailed information');
      console.log('about where exactly the authentication failed.');
      console.log('Look for emojis in the logs: 🔐 📧 🔧 ✅ 🧪 ❌ 🔍');
      
      console.log('\n💡 Troubleshooting:');
      console.log('===================');
      console.log('1. Check if Supabase client creation fails');
      console.log('2. Check if database query returns user');
      console.log('3. Check if bcrypt comparison works');
      console.log('4. Check for any exceptions in the process');
      
      return { success: false, error: responseData.error };
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
}

// Also test a simple user to compare
async function testSimpleUser() {
  console.log('\n🧪 TESTING SIMPLE USER FOR COMPARISON');
  console.log('=====================================');
  
  try {
    // Create a simple test user first
    const testEmail = `simple-test-${Date.now()}@lumo.com`;
    const testPassword = 'SimpleTest123';
    
    console.log(`Creating user: ${testEmail}`);
    
    const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Simple Test User'
      })
    });
    
    const registerData = await registerResponse.json();
    
    console.log(`Registration: ${registerResponse.status} - ${registerData.success ? 'Success' : 'Failed'}`);
    
    if (registerData.success) {
      console.log('✅ User created, testing login...');
      
      const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const loginData = await loginResponse.json();
      
      console.log(`Login: ${loginResponse.status} - ${loginData.success ? 'Success' : 'Failed'}`);
      
      if (loginData.success) {
        console.log('✅ Simple user login works!');
        console.log('This means the login system is functional');
        console.log('The issue is specific to the admin user');
      } else {
        console.log('❌ Simple user login also fails');
        console.log('This indicates a system-wide issue');
        console.log(`Error: ${loginData.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Simple user test error:', error.message);
  }
}

// Run both tests
async function runAllTests() {
  const adminResult = await testAdminWithLogs();
  await testSimpleUser();
  
  console.log('\n🎯 FINAL SUMMARY');
  console.log('================');
  
  if (adminResult.success) {
    console.log('🎉 Admin login working!');
    console.log(`✨ Email: ${adminResult.user.email}`);
    console.log(`✨ Role: ${adminResult.user.role}`);
    console.log('✨ System ready for use');
  } else {
    console.log('⚠️ Admin login not working');
    console.log('📖 Review the detailed logs above');
    console.log('🔧 Manual intervention may be required');
  }
}

runAllTests().catch(console.error); 