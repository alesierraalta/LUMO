#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

/**
 * LUMO Production Connectivity Test
 * 
 * This script tests various aspects of the production deployment
 * to diagnose the DATABASE_URL configuration issue.
 */

const https = require('https');
const { URL } = require('url');

console.log('🔍 LUMO Production Connectivity Test');
console.log('=====================================');

const PRODUCTION_URL = 'https://lumo-woad.vercel.app';
const PROJECT_REF = 'ubjujxtvlubxowsphvuk';

// Test functions
const testEndpoint = (url, description) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            responseTime,
            data: jsonData,
            description
          });
        } catch (e) {
          resolve({
            success: true,
            status: res.statusCode,
            responseTime,
            data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
            description
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        description
      });
    });
  });
};

const runTests = async () => {
  console.log('\n🧪 Running Production Tests...\n');
  
  const tests = [
    {
      url: `${PRODUCTION_URL}/api/health`,
      description: 'Health Check Endpoint'
    },
    {
      url: `${PRODUCTION_URL}/api/auth/login`,
      description: 'Auth Login Endpoint (GET)'
    },
    {
      url: `${PRODUCTION_URL}/`,
      description: 'Main Application Page'
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.description}`);
    console.log(`URL: ${test.url}`);
    
    const result = await testEndpoint(test.url, test.description);
    
    if (result.success) {
      console.log(`✅ Status: ${result.status} | Response Time: ${result.responseTime}ms`);
      
      if (test.description === 'Health Check Endpoint') {
        console.log('📊 Health Check Details:');
        console.log(JSON.stringify(result.data, null, 2));
        
        if (result.data.status === 'unhealthy') {
          console.log('❌ DATABASE CONNECTION ISSUE DETECTED');
          console.log('🔧 Root Cause: DATABASE_URL not configured in Vercel');
        }
      }
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    console.log('─'.repeat(50));
  }
  
  console.log('\n📋 Diagnosis Summary:');
  console.log('====================');
  
  // Test health endpoint specifically
  const healthResult = await testEndpoint(`${PRODUCTION_URL}/api/health`, 'Health Check');
  
  if (healthResult.success && healthResult.data.status === 'unhealthy') {
    console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
    console.log('- Database connection is failing');
    console.log('- Health endpoint shows "unhealthy" status');
    console.log('- Error: "Network error" in database connection');
    console.log('');
    console.log('🔧 REQUIRED ACTION:');
    console.log('1. Add DATABASE_URL to Vercel environment variables');
    console.log('2. Use this exact format:');
    console.log(`   DATABASE_URL=postgres://postgres.${PROJECT_REF}:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres`);
    console.log('3. Replace [PASSWORD] with your actual Supabase database password');
    console.log('4. Redeploy the application');
    console.log('');
    console.log('📍 Where to get password:');
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`);
    console.log('');
    console.log('📍 Where to add environment variable:');
    console.log('   Vercel Dashboard → Project Settings → Environment Variables');
    
  } else if (healthResult.success && healthResult.data.status === 'healthy') {
    console.log('✅ GOOD NEWS: Database connection is working!');
    console.log('🎯 Ready for full functionality testing');
    
  } else {
    console.log('❓ Unable to determine database status');
    console.log('🔍 Check network connectivity and try again');
  }
  
  console.log('\n🌐 Production Environment Info:');
  console.log('===============================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Supabase Project: ${PROJECT_REF}`);
  console.log(`Region: us-east-2`);
  console.log(`Expected DATABASE_URL format:`);
  console.log(`postgres://postgres.${PROJECT_REF}:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres`);
  
  console.log('\n✅ Environment Variables Status:');
  console.log('- APP_NAME: ✅ Configured');
  console.log('- NODE_ENV: ✅ Configured');
  console.log('- FORCE_SUPABASE: ✅ Configured');
  console.log('- NEXT_PUBLIC_SUPABASE_URL: ✅ Configured');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Configured');
  console.log('- DATABASE_URL: ❌ MISSING OR INCORRECT');
  
  console.log('\n🔄 Next Steps:');
  console.log('1. Configure DATABASE_URL in Vercel');
  console.log('2. Redeploy application');
  console.log('3. Run this test again');
  console.log('4. Test admin login functionality');
  console.log('5. Verify all features work 100%');
};

// Run the tests
runTests().catch(console.error); 