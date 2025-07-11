#!/usr/bin/env node

/**
 * Production DELETE Test - Direct Test of Category Deletion
 * Tests the actual DELETE functionality in production
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Production URL
const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

// Test configuration
const TEST_CONFIG = {
  production: {
    url: PRODUCTION_URL,
    endpoints: {
      debug: '/api/debug-production',
      categories: '/api/categories',
      auth: '/api/auth/me'
    }
  }
};

// Make HTTP request helper
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Test/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
};

// Test functions
const testProductionEnvironment = async () => {
  console.log('🔍 PRODUCTION DELETE FUNCTIONALITY TEST');
  console.log('======================================');
  
  try {
    // 1. Test diagnostic endpoint
    console.log('\n1. 📊 TESTING DIAGNOSTIC ENDPOINT');
    console.log('----------------------------------');
    const debugResponse = await makeRequest(`${PRODUCTION_URL}/api/debug-production`);
    console.log('Status:', debugResponse.status);
    console.log('Environment Data:', JSON.stringify(debugResponse.data, null, 2));
    
    // 2. Test categories endpoint (GET)
    console.log('\n2. 📋 TESTING CATEGORIES ENDPOINT (GET)');
    console.log('----------------------------------------');
    const categoriesResponse = await makeRequest(`${PRODUCTION_URL}/api/categories`);
    console.log('Status:', categoriesResponse.status);
    console.log('Categories Response:', JSON.stringify(categoriesResponse.data, null, 2));
    
    // 3. Test authentication endpoint
    console.log('\n3. 🔐 TESTING AUTHENTICATION ENDPOINT');
    console.log('-------------------------------------');
    const authResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/me`);
    console.log('Status:', authResponse.status);
    console.log('Auth Response:', JSON.stringify(authResponse.data, null, 2));
    
    // 4. Test DELETE with a dummy ID (should fail with 401 or 404)
    console.log('\n4. 🗑️ TESTING DELETE ENDPOINT (WITHOUT AUTH)');
    console.log('----------------------------------------------');
    const deleteResponse = await makeRequest(`${PRODUCTION_URL}/api/categories/dummy-id`, {
      method: 'DELETE'
    });
    console.log('Status:', deleteResponse.status);
    console.log('Delete Response:', JSON.stringify(deleteResponse.data, null, 2));
    
    // 5. Summary
    console.log('\n5. 📝 SUMMARY');
    console.log('=============');
    console.log('✅ Diagnostic endpoint:', debugResponse.status === 200 ? 'WORKING' : 'FAILED');
    console.log('✅ Categories endpoint:', categoriesResponse.status === 200 ? 'WORKING' : 'FAILED');
    console.log('✅ Auth endpoint:', authResponse.status === 200 || authResponse.status === 401 ? 'WORKING' : 'FAILED');
    console.log('✅ Delete endpoint:', deleteResponse.status === 401 || deleteResponse.status === 404 ? 'WORKING' : 'FAILED');
    
    // 6. Issue Analysis
    console.log('\n6. 🔍 ISSUE ANALYSIS');
    console.log('====================');
    
    if (debugResponse.data && debugResponse.data.environment === undefined) {
      console.log('❌ ISSUE: NODE_ENV is undefined in production runtime');
      console.log('💡 SOLUTION: Need to set NODE_ENV=production in Vercel runtime environment');
    }
    
    if (deleteResponse.status === 401) {
      console.log('❌ ISSUE: DELETE request returns 401 (Unauthorized)');
      console.log('💡 CAUSE: Authentication is failing in production environment');
    }
    
    if (deleteResponse.status === 404) {
      console.log('✅ EXPECTED: DELETE request returns 404 (Not Found) - authentication working');
      console.log('💡 This means auth is working, just the dummy ID doesn\'t exist');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. If NODE_ENV is undefined, check Vercel environment variables');
    console.log('2. If getting 401, authentication is failing - check Supabase configuration');
    console.log('3. If getting 404, authentication is working - test with real category ID');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Run the test
testProductionEnvironment().catch(console.error);