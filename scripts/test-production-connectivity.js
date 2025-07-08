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
          if (result.data.database && result.data.database.error) {
            console.log(`🔧 Reason: ${result.data.database.error}`);
          }
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
  
  if (healthResult.success && healthResult.data.status === 'healthy') {
    console.log('✅ GOOD NEWS: Database connection is working!');
    console.log('🎯 Ready for full functionality testing');
    
  } else if (healthResult.success && healthResult.data.status === 'unhealthy') {
    console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
    console.log('- Database connection is failing');
    console.log('- Health endpoint shows "unhealthy" status');
    if (healthResult.data.database && healthResult.data.database.error) {
        console.log(`- Error: ${healthResult.data.database.error}`);
    }
    
  } else {
    console.log('❓ Unable to determine database status');
    console.log('🔍 Check network connectivity and try again');
  }
  
  console.log('\n🌐 Production Environment Info:');
  console.log('===============================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Supabase Project: ${PROJECT_REF}`);
  console.log(`Region: us-east-2`);
};

// Run the tests
runTests().catch(console.error); 