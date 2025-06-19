#!/usr/bin/env node

/**
 * Debug script for locations page authentication issue
 * Tests the authentication flow that's causing redirects to login
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: 'supabase.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase Authentication...\n');
  
  try {
    // Test 1: Login with known credentials
    console.log('1️⃣ Testing login with alesierraalta@gmail.com...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return false;
    }

    if (!authData.session) {
      console.error('❌ No session created after login');
      return false;
    }

    console.log('✅ Login successful!');
    console.log('📊 Session info:');
    console.log('  - User ID:', authData.user?.id);
    console.log('  - Email:', authData.user?.email);
    console.log('  - Access Token:', authData.session.access_token.substring(0, 20) + '...');
    
    return authData.session;

  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

async function testSupabaseMeEndpoint(session) {
  console.log('\n2️⃣ Testing /api/auth/supabase-me endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ API endpoint failed with status:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }

    const userData = await response.json();
    console.log('✅ API endpoint successful!');
    console.log('📊 User data:');
    console.log('  - Success:', userData.success);
    console.log('  - User ID:', userData.user?.id);
    console.log('  - Email:', userData.user?.email);
    console.log('  - Role:', userData.user?.role);
    console.log('  - Active:', userData.user?.isActive);
    
    return userData;

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

async function testLocationsAccess() {
  console.log('\n3️⃣ Testing locations page access...');
  
  try {
    const response = await fetch('http://localhost:3000/locations', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('📡 Response status:', response.status);
    console.log('📍 Response headers:');
    console.log('  - Location:', response.headers.get('location'));
    console.log('  - Set-Cookie:', response.headers.get('set-cookie'));

    if (response.status === 302 || response.status === 307) {
      const redirectLocation = response.headers.get('location');
      if (redirectLocation?.includes('/login')) {
        console.log('❌ Redirected to login page!');
        console.log('🔗 Redirect URL:', redirectLocation);
        return false;
      }
    }

    if (response.status === 200) {
      console.log('✅ Locations page accessible!');
      return true;
    }

    console.log('⚠️ Unexpected response status:', response.status);
    return false;

  } catch (error) {
    console.error('❌ Locations access test failed:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n4️⃣ Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Sample data:', data);
    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Locations Authentication Debug\n');
  console.log('🎯 Investigating why locations page redirects to login\n');
  
  // Test Supabase authentication
  const session = await testSupabaseAuth();
  if (!session) {
    console.log('\n❌ Authentication failed - cannot proceed with other tests');
    process.exit(1);
  }

  // Test the API endpoint
  const apiResult = await testSupabaseMeEndpoint(session);
  if (!apiResult) {
    console.log('\n⚠️ API endpoint test failed - this might be causing the redirect');
  }

  // Test database connection
  const dbResult = await testDatabaseConnection();
  if (!dbResult) {
    console.log('\n⚠️ Database connection failed - this might be causing issues');
  }

  // Test locations page access (this will likely fail due to no cookies)
  await testLocationsAccess();

  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (session && apiResult && dbResult) {
    console.log('✅ Authentication system is working correctly');
    console.log('🔧 The issue is likely with cookie/session management in the browser');
    console.log('💡 Possible solutions:');
    console.log('   1. Clear browser cookies and login again');
    console.log('   2. Check if Supabase session is being properly set in browser');
    console.log('   3. Verify middleware is not interfering with authentication');
  } else {
    console.log('❌ Authentication system has issues:');
    if (!session) console.log('   - Supabase login failed');
    if (!apiResult) console.log('   - API endpoint /api/auth/supabase-me failed');
    if (!dbResult) console.log('   - Database connection failed');
  }
  
  console.log('='.repeat(60));
}

main().catch(console.error); 