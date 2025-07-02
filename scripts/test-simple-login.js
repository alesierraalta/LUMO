#!/usr/bin/env node

/**
 * Test Simple Login Endpoint
 * This should show us exactly what's happening in the server
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testSimpleLogin() {
  console.log('🔥 TESTING SIMPLE LOGIN ENDPOINT');
  console.log('=================================');
  
  try {
    console.log('\n👤 Testing Admin Login (Simple)');
    console.log('-------------------------------');
    
    const adminEmail = 'alesierraalta@gmail.com';
    const adminPassword = 'admin123';
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    console.log('\n📡 Making API call to /api/auth/login-simple...');
    
    const startTime = Date.now();
    
    const response = await fetch(`${DEV_URL}/api/auth/login-simple`, {
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
      console.log('\n🎉 SIMPLE LOGIN SUCCESS!');
      console.log('========================');
      console.log(`✅ Email: ${responseData.user.email}`);
      console.log(`✅ Role: ${responseData.user.role}`);
      console.log(`✅ Message: ${responseData.message}`);
      
      if (responseData.debug) {
        console.log(`✅ Debug Info: ${JSON.stringify(responseData.debug, null, 2)}`);
      }
      
      return {
        success: true,
        user: responseData.user
      };
      
    } else {
      console.log('\n❌ SIMPLE LOGIN FAILED');
      console.log('======================');
      console.log(`Error: ${responseData.error}`);
      
      if (responseData.debug) {
        console.log(`Debug Info: ${JSON.stringify(responseData.debug, null, 2)}`);
      }
      
      return { success: false, error: responseData.error };
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTest() {
  const result = await testSimpleLogin();
  
  console.log('\n🎯 FINAL RESULT');
  console.log('===============');
  
  if (result.success) {
    console.log('🎉 Simple login is working!');
    console.log('The issue was with the complex login logic');
    console.log('We can now switch to using the simple login');
  } else {
    console.log('⚠️ Simple login also failed');
    console.log('This indicates a fundamental server issue');
    console.log('Check the Choreo logs for detailed error information');
  }
}

runTest().catch(console.error); 