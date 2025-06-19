#!/usr/bin/env node

/**
 * Debug script to test /api/auth/supabase-me endpoint
 * This endpoint is called by the client-side auth context and might be failing
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: 'supabase.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseMeEndpoint() {
  console.log('🧪 Testing /api/auth/supabase-me endpoint...\n');
  
  try {
    // Step 1: Login to get a valid session
    console.log('1️⃣ Logging in to get session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message || 'No session');
      return false;
    }

    console.log('✅ Login successful');
    console.log('📊 Session info:');
    console.log('  - User ID:', authData.user.id);
    console.log('  - Email:', authData.user.email);
    console.log('  - Access Token:', authData.session.access_token.substring(0, 20) + '...');

    // Step 2: Test the endpoint with the session token
    console.log('\n2️⃣ Testing /api/auth/supabase-me endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📋 Response headers:');
    console.log('  - Content-Type:', response.headers.get('content-type'));
    console.log('  - Content-Length:', response.headers.get('content-length'));

    if (!response.ok) {
      console.error('❌ API call failed with status:', response.status);
      const errorText = await response.text();
      console.error('📄 Error response:', errorText);
      return false;
    }

    const responseData = await response.json();
    console.log('✅ API call successful!');
    console.log('📊 Response data:');
    console.log('  - Success:', responseData.success);
    console.log('  - User ID:', responseData.user?.id);
    console.log('  - Email:', responseData.user?.email);
    console.log('  - Role:', responseData.user?.role);
    console.log('  - Is Active:', responseData.user?.isActive);
    console.log('  - Permissions:', responseData.user?.permissions?.length || 0, 'permissions');

    // Step 3: Test without Authorization header (should fail)
    console.log('\n3️⃣ Testing without Authorization header (should fail)...');
    
    const noAuthResponse = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('📡 Response status (no auth):', noAuthResponse.status);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctly returns 401 without auth token');
    } else {
      console.log('⚠️ Unexpected status without auth token:', noAuthResponse.status);
    }

    // Step 4: Test with invalid token (should fail)
    console.log('\n4️⃣ Testing with invalid token (should fail)...');
    
    const invalidTokenResponse = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-12345',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('📡 Response status (invalid token):', invalidTokenResponse.status);
    
    if (invalidTokenResponse.status === 401) {
      console.log('✅ Correctly returns 401 with invalid token');
    } else {
      console.log('⚠️ Unexpected status with invalid token:', invalidTokenResponse.status);
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting /api/auth/supabase-me Endpoint Test\n');
  console.log('🎯 Testing the endpoint that client-side auth context calls\n');
  
  const success = await testSupabaseMeEndpoint();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ /api/auth/supabase-me endpoint is working correctly');
    console.log('💡 The issue might be:');
    console.log('   1. Client-side session not being established properly');
    console.log('   2. Cookies not being set correctly in browser');
    console.log('   3. CORS or cookie issues preventing proper auth');
    console.log('   4. Race condition in auth context initialization');
  } else {
    console.log('❌ /api/auth/supabase-me endpoint has issues');
    console.log('🔧 This is likely causing the client-side auth failures');
    console.log('💡 Possible solutions:');
    console.log('   1. Fix the API endpoint implementation');
    console.log('   2. Check database connectivity');
    console.log('   3. Verify Supabase configuration');
  }
  
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error); 