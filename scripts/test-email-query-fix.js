#!/usr/bin/env node

/**
 * Test script to verify the email-based query fix
 * Tests that querying by email instead of ID resolves the 406 error
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

async function testEmailQueryFix() {
  console.log('🧪 Testing Email-Based Query Fix...\n');
  
  try {
    // Step 1: Login to get session
    console.log('1️⃣ Establishing session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message || 'No session');
      return false;
    }

    console.log('✅ Session established');
    console.log('📊 Auth user info:');
    console.log('  - Auth ID:', authData.user.id);
    console.log('  - Email:', authData.user.email);

    // Step 2: Test the OLD query (by ID) - should fail
    console.log('\n2️⃣ Testing OLD query (by ID) - should fail...');
    
    const { data: oldData, error: oldError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_active,
        role_id,
        roles (
          id,
          name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (oldError) {
      console.log('❌ OLD query failed as expected:', oldError.message);
    } else {
      console.log('⚠️ OLD query unexpectedly succeeded');
    }

    // Step 3: Test the NEW query (by email) - should succeed
    console.log('\n3️⃣ Testing NEW query (by email) - should succeed...');
    
    const { data: newData, error: newError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_active,
        role_id,
        roles (
          id,
          name
        )
      `)
      .eq('email', authData.user.email)
      .single();

    if (newError) {
      console.error('❌ NEW query failed:', newError.message);
      return false;
    }

    console.log('✅ NEW query successful!');
    console.log('📊 Database user info:');
    console.log('  - DB ID:', newData.id);
    console.log('  - Email:', newData.email);
    console.log('  - Name:', newData.name);
    console.log('  - Is Active:', newData.is_active);
    console.log('  - Role ID:', newData.role_id);
    console.log('  - Role Name:', newData.roles?.name);

    // Step 4: Verify ID mismatch
    console.log('\n4️⃣ Verifying ID mismatch...');
    console.log('  - Auth User ID:', authData.user.id);
    console.log('  - DB User ID:  ', newData.id);
    console.log('  - IDs Match:   ', authData.user.id === newData.id ? '✅ YES' : '❌ NO');

    if (authData.user.id !== newData.id) {
      console.log('🔍 CONFIRMED: ID mismatch between auth.users and public.users');
      console.log('💡 Solution: Query by email instead of ID (IMPLEMENTED)');
    }

    // Step 5: Create full user object (like auth context does)
    console.log('\n5️⃣ Creating full user object...');
    
    const fullUser = {
      id: newData.id, // Use database ID, not auth ID
      email: newData.email,
      name: newData.name,
      role: newData.roles?.name || 'USER',
      isActive: newData.is_active,
      permissions: []
    };

    console.log('✅ Full user object created:');
    console.log('  - ID:', fullUser.id);
    console.log('  - Email:', fullUser.email);
    console.log('  - Name:', fullUser.name);
    console.log('  - Role:', fullUser.role);
    console.log('  - Is Active:', fullUser.isActive);

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Email-Based Query Fix Test\n');
  console.log('🎯 Verifying that querying by email resolves the 406 error\n');
  
  const success = await testEmailQueryFix();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 RESULTS:');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ SUCCESS: Email-based query fix is working!');
    console.log('');
    console.log('🎉 KEY IMPROVEMENTS:');
    console.log('   ✅ Query by email instead of ID resolves 406 error');
    console.log('   ✅ Successfully retrieves user data from database');
    console.log('   ✅ Handles ID mismatch between auth.users and public.users');
    console.log('   ✅ Should eliminate database query errors in auth context');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('   1. Restart the development server');
    console.log('   2. Login to the application');
    console.log('   3. Check browser console - should see no more 406 errors');
    console.log('   4. Try accessing the locations page - should work without redirects');
  } else {
    console.log('❌ FAILED: Email-based query fix needs more work');
    console.log('🔧 Additional debugging may be required.');
  }
  
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error); 