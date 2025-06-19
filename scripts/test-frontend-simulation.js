#!/usr/bin/env node

/**
 * Simplified script to understand the frontend auth context issue
 * Simulates what happens when useAuth() is called in the browser
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

async function simulateFrontendAuthContext() {
  console.log('🧪 Simulating Frontend Auth Context...\n');
  
  try {
    // Step 1: Simulate user login (what happens when user logs in)
    console.log('1️⃣ Simulating user login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Login simulation failed:', authError?.message || 'No session');
      return false;
    }

    console.log('✅ Login simulation successful');
    console.log('📊 Session created:');
    console.log('  - User ID:', authData.user.id);
    console.log('  - Email:', authData.user.email);
    console.log('  - Has Access Token:', !!authData.session.access_token);

    // Step 2: Simulate what fetchUser() does in auth context
    console.log('\n2️⃣ Simulating fetchUser() from auth context...');
    
    // This is what the auth context does:
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('❌ No valid session found (this would cause redirect to login)');
      return false;
    }

    console.log('✅ Valid session found');
    console.log('📊 Session info:');
    console.log('  - User ID:', session.user.id);
    console.log('  - Email:', session.user.email);
    console.log('  - Access Token exists:', !!session.access_token);

    // Step 3: This is where the problem occurs - the fetch call to /api/auth/supabase-me
    console.log('\n3️⃣ This is where the frontend would call /api/auth/supabase-me...');
    console.log('🚨 PROBLEM: The frontend makes a fetch() call to /api/auth/supabase-me');
    console.log('🚨 If this call fails, the auth context sets user to null');
    console.log('🚨 When user is null, components like UserButton show "Login" button');
    console.log('🚨 This might trigger automatic redirects to /login');

    // Step 4: Simulate fallback behavior
    console.log('\n4️⃣ Simulating fallback to basic user info...');
    
    const basicUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      role: session.user.user_metadata?.role || 'USER',
      isActive: true,
      permissions: []
    };

    console.log('✅ Fallback user created:');
    console.log('  - ID:', basicUser.id);
    console.log('  - Email:', basicUser.email);
    console.log('  - Name:', basicUser.name);
    console.log('  - Role:', basicUser.role);

    return true;

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Frontend Auth Context Simulation\n');
  console.log('🎯 Understanding why locations page redirects to login\n');
  
  const success = await simulateFrontendAuthContext();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ Supabase authentication is working correctly');
    console.log('');
    console.log('🚨 THE ISSUE:');
    console.log('   The auth context tries to call /api/auth/supabase-me via fetch()');
    console.log('   If this call fails, it sets user to null');
    console.log('   When user is null, the UI shows login prompts');
    console.log('');
    console.log('💡 SOLUTIONS:');
    console.log('   1. Fix the /api/auth/supabase-me endpoint to handle all cases');
    console.log('   2. Modify auth context to use fallback user data when API fails');
    console.log('   3. Remove dependency on /api/auth/supabase-me in auth context');
    console.log('   4. Use only Supabase session data for client-side auth');
    console.log('');
    console.log('🔧 RECOMMENDED FIX:');
    console.log('   Modify auth context to rely only on Supabase session data');
    console.log('   and not make API calls to /api/auth/supabase-me');
  } else {
    console.log('❌ Supabase authentication has fundamental issues');
  }
  
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error); 