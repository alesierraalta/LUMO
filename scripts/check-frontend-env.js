#!/usr/bin/env node

/**
 * Check Frontend Environment Variables
 * Verify what NEXT_PUBLIC variables are available in the browser
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function checkFrontendEnv() {
  console.log('🔍 CHECKING FRONTEND ENVIRONMENT VARIABLES');
  console.log('==========================================');
  console.log(`Target URL: ${DEV_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Create a test endpoint to check frontend env vars
    console.log('🧪 Testing env config endpoint...');
    const response = await fetch(`${DEV_URL}/api/debug-env-config`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Environment config response:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check if the URLs match what we expect
      const expectedDevUrl = 'https://ndprriqyhddjoixrlqnz.supabase.co';
      const actualUrl = data.client?.NEXT_PUBLIC_SUPABASE_URL;
      
      console.log('\n🔍 ANALYSIS:');
      console.log('=============');
      console.log(`Expected URL: ${expectedDevUrl}`);
      console.log(`Actual URL: ${actualUrl}`);
      
      if (actualUrl === expectedDevUrl) {
        console.log('✅ Frontend is using DEVELOPMENT URLs - CORRECT!');
      } else {
        console.log('❌ Frontend is using PRODUCTION URLs - PROBLEM!');
        console.log('');
        console.log('🔧 SOLUTION NEEDED:');
        console.log('The NEXT_PUBLIC_* variables need to be updated in Choreo');
        console.log('and the application needs to be redeployed.');
      }
      
    } else {
      console.log(`❌ Env config endpoint failed: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Frontend env check error:', error.message);
  }
  
  console.log('\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. Verify NEXT_PUBLIC_SUPABASE_URL in Choreo environment');
  console.log('2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY in Choreo environment');
  console.log('3. Force a redeploy if variables are correct');
  console.log('4. Clear browser cache if needed');
}

checkFrontendEnv().catch(console.error); 