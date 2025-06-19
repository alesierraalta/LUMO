#!/usr/bin/env node

/**
 * Debug script to understand middleware cookie handling
 * Tests what cookies are set and how middleware processes them
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: 'supabase.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMiddlewareCookies() {
  console.log('🧪 Debugging Middleware Cookie Handling...\n');
  
  try {
    // Step 1: Login and check what session data we get
    console.log('1️⃣ Logging in to check session data...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message || 'No session');
      return false;
    }

    console.log('✅ Login successful');
    console.log('📊 Session data structure:');
    console.log('  - Access Token:', authData.session.access_token.substring(0, 30) + '...');
    console.log('  - Refresh Token:', authData.session.refresh_token.substring(0, 30) + '...');
    console.log('  - Token Type:', authData.session.token_type);
    console.log('  - Expires At:', new Date(authData.session.expires_at * 1000).toISOString());

    // Step 2: Simulate what middleware expects
    console.log('\n2️⃣ Simulating middleware cookie detection...');
    
    const cookieNames = [
      'supabase-auth-token',
      'sb-access-token', 
      'supabase.auth.token',
      'auth-token'
    ];

    console.log('🔍 Middleware looks for these cookies in order:');
    cookieNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    // Step 3: Check what Supabase client would set as cookies
    console.log('\n3️⃣ Checking Supabase client cookie behavior...');
    
    // In browser, Supabase sets cookies automatically
    // But in Node.js, we need to check what the expected format is
    console.log('📝 Expected cookie format for Supabase:');
    console.log('  - Name: sb-<project-ref>-auth-token');
    console.log('  - Value: JSON with access_token, refresh_token, etc.');
    console.log('  - Project Ref:', supabaseUrl.split('//')[1].split('.')[0]);
    
    const expectedCookieName = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    console.log('  - Full Cookie Name:', expectedCookieName);

    // Step 4: Simulate middleware token validation
    console.log('\n4️⃣ Simulating middleware token validation...');
    
    const token = authData.session.access_token;
    console.log('📏 Token validation checks:');
    console.log('  - Token length:', token.length, '(middleware requires > 20)');
    console.log('  - Length check:', token.length > 20 ? '✅ PASS' : '❌ FAIL');
    console.log('  - Token format: JWT-like?', token.includes('.') ? '✅ YES' : '❌ NO');

    // Step 5: Identify the problem
    console.log('\n5️⃣ Identifying the problem...');
    console.log('🚨 LIKELY ISSUES:');
    console.log('  1. Middleware runs BEFORE cookies are set by browser');
    console.log('  2. Cookie names don\'t match what middleware expects');
    console.log('  3. Middleware is too strict with token validation');
    console.log('  4. Race condition between navigation and auth setup');

    return true;

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Middleware Cookie Debug\n');
  console.log('🎯 Understanding why middleware redirects to login\n');
  
  const success = await debugMiddlewareCookies();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ Session data analysis complete');
    console.log('');
    console.log('🚨 PROBABLE ROOT CAUSE:');
    console.log('   The middleware is executing BEFORE the browser has a chance');
    console.log('   to set the Supabase authentication cookies properly.');
    console.log('');
    console.log('💡 SOLUTIONS:');
    console.log('   1. Make middleware less strict for authenticated routes');
    console.log('   2. Add /locations to public routes temporarily');
    console.log('   3. Modify middleware to handle missing cookies gracefully');
    console.log('   4. Use server-side auth check instead of middleware');
    console.log('');
    console.log('🔧 RECOMMENDED FIX:');
    console.log('   Modify middleware to be less aggressive with redirects');
    console.log('   and let page-level auth handle the actual verification.');
  } else {
    console.log('❌ Debug analysis failed');
  }
  
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error); 