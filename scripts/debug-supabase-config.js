#!/usr/bin/env node

/**
 * Debug Supabase Configuration
 * Check what URLs and keys are being used
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function debugSupabaseConfig() {
  console.log('🔍 DEBUGGING SUPABASE CONFIGURATION');
  console.log('===================================');
  console.log(`Target URL: ${DEV_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Test the debug endpoint
    console.log('🧪 Testing debug endpoint...');
    const response = await fetch(`${DEV_URL}/api/debug-env-supabase`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug endpoint response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Debug endpoint failed: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error.message);
  }
  
  console.log('\n🔧 Testing login API configuration...');
  
  try {
    // Test login with invalid credentials to see which URL it tries
    const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`Login API Status: ${loginResponse.status}`);
    
    if (loginResponse.ok || loginResponse.status === 401) {
      const loginData = await loginResponse.json();
      console.log('Login API Response:', loginData);
    } else {
      console.log('❌ Login API error');
      const text = await loginResponse.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Login API error:', error.message);
  }
  
  console.log('\n📋 EXPECTED CONFIGURATION');
  console.log('=========================');
  console.log('✅ Should use: https://ndprriqyhddjoixrlqnz.supabase.co (DEVELOPMENT)');
  console.log('❌ Should NOT use: https://ubjujxtvlubxowsphvuk.supabase.co (PRODUCTION)');
  console.log('');
  console.log('If you see production URLs in the logs above, the environment');
  console.log('variables are not configured correctly in Choreo.');
}

debugSupabaseConfig().catch(console.error); 