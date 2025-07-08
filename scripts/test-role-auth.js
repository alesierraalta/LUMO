#!/usr/bin/env node

/**
 * LUMO - Role Management Authentication Test
 * Tests the authentication flow for role management APIs
 * 
 * This script verifies that:
 * 1. Supabase client can be created
 * 2. Session can be retrieved
 * 3. API calls with proper headers work
 * 4. Role management endpoints are accessible
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration - using production environment
const BASE_URL = 'https://lumo-woad.vercel.app';
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';

// Test credentials
const TEST_EMAIL = 'alesierraalta@gmail.com';
const TEST_PASSWORD = 'admin123';

console.log('🚀 LUMO Role Management Authentication Test');
console.log('=' .repeat(60));

async function testSupabaseClient() {
  console.log('\n1️⃣ Testing Supabase Client Creation...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created successfully');
    
    // Test auth status
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ No active session (expected for server-side test)');
      return null;
    }
    
    if (session) {
      console.log('✅ Active session found:', session.user.email);
      return session.access_token;
    }
    
    console.log('ℹ️ No active session (normal for server-side test)');
    return null;
    
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n2️⃣ Testing Login Authentication...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      return null;
    }
    
    if (data.session) {
      console.log('✅ Login successful:', data.user.email);
      console.log('🔑 Access token length:', data.session.access_token.length);
      console.log('🔑 Token preview:', data.session.access_token.substring(0, 20) + '...');
      return data.session.access_token;
    }
    
    console.error('❌ Login failed: No session returned');
    return null;
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testApiCall(endpoint, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lumo-woad.vercel.app',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testRoleManagementApis(token) {
  console.log('\n3️⃣ Testing Role Management APIs...');
  
  const endpoints = [
    '/api/roles',
    '/api/permissions'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      
      const response = await testApiCall(endpoint, token);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint} - Success (${response.status})`);
        
        try {
          const data = JSON.parse(response.body);
          if (endpoint === '/api/roles') {
            console.log(`   📊 Found ${data.roles?.length || 0} roles`);
          } else if (endpoint === '/api/permissions') {
            console.log(`   📊 Found ${data.permissions?.length || 0} permissions`);
          }
        } catch (parseError) {
          console.log(`   ⚠️ Response parsing error: ${parseError.message}`);
        }
      } else {
        console.log(`❌ ${endpoint} - Failed (${response.status})`);
        console.log(`   📄 Response: ${response.body.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

async function testRolePermissionsApi(token) {
  console.log('\n4️⃣ Testing Role Permissions API...');
  
  try {
    // First get roles to test role permissions
    const rolesResponse = await testApiCall('/api/roles', token);
    
    if (rolesResponse.status === 200) {
      const rolesData = JSON.parse(rolesResponse.body);
      const roles = rolesData.roles || [];
      
      if (roles.length > 0) {
        const firstRole = roles[0];
        const endpoint = `/api/roles/${firstRole.id}/permissions`;
        
        console.log(`📡 Testing ${endpoint}...`);
        
        const response = await testApiCall(endpoint, token);
        
        if (response.status === 200) {
          console.log(`✅ Role permissions API - Success (${response.status})`);
          
          try {
            const data = JSON.parse(response.body);
            console.log(`   📊 Role ${firstRole.name} has ${data.permissions?.length || 0} permissions`);
          } catch (parseError) {
            console.log(`   ⚠️ Response parsing error: ${parseError.message}`);
          }
        } else {
          console.log(`❌ Role permissions API - Failed (${response.status})`);
          console.log(`   📄 Response: ${response.body.substring(0, 200)}...`);
        }
      } else {
        console.log('⚠️ No roles found to test permissions API');
      }
    } else {
      console.log('❌ Cannot test role permissions - roles API failed');
    }
    
  } catch (error) {
    console.error('❌ Role permissions test error:', error.message);
  }
}

async function main() {
  try {
    // Test 1: Supabase Client
    await testSupabaseClient();
    
    // Test 2: Login and get token
    const token = await testLogin();
    
    if (!token) {
      console.log('\n❌ Cannot proceed with API tests - no authentication token');
      process.exit(1);
    }
    
    // Test 3: Role Management APIs
    await testRoleManagementApis(token);
    
    // Test 4: Role Permissions API
    await testRolePermissionsApi(token);
    
    console.log('\n✅ Role Management Authentication Test Complete');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main(); 