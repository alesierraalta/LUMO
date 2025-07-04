#!/usr/bin/env node

/**
 * LUMO Authentication Diagnostic Script
 * Identifies why API calls are returning 401 errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnoseAuthIssue() {
  console.log('🔍 LUMO Authentication Diagnostic');
  console.log('=====================================\n');

  // Check environment variables
  console.log('1. Environment Variables Check:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   CHOREO_ENVIRONMENT:', process.env.CHOREO_ENVIRONMENT);
  console.log('');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required Supabase environment variables');
    return;
  }

  // Test Supabase connection
  console.log('2. Supabase Connection Test:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('   ❌ Connection failed:', error.message);
    } else {
      console.log('   ✅ Connection successful');
    }
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
  }
  console.log('');

  // Check if user exists in database
  console.log('3. User Database Check:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_active,
        roles!inner(name)
      `)
      .eq('email', 'alesierraalta@gmail.com');

    if (error) {
      console.log('   ❌ Database query failed:', error.message);
    } else if (users && users.length > 0) {
      console.log('   ✅ User found in database:');
      console.log('      ID:', users[0].id);
      console.log('      Email:', users[0].email);
      console.log('      Name:', users[0].name);
      console.log('      Role:', users[0].roles?.name || 'No role');
      console.log('      Active:', users[0].is_active);
    } else {
      console.log('   ⚠️ User not found in database');
    }
  } catch (error) {
    console.log('   ❌ Database check error:', error.message);
  }
  console.log('');

  // Check auth.users table
  console.log('4. Supabase Auth Users Check:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log('   ❌ Auth users query failed:', error.message);
    } else {
      const targetUser = authUsers.users.find(u => u.email === 'alesierraalta@gmail.com');
      if (targetUser) {
        console.log('   ✅ User found in auth.users:');
        console.log('      ID:', targetUser.id);
        console.log('      Email:', targetUser.email);
        console.log('      Email confirmed:', targetUser.email_confirmed_at ? 'Yes' : 'No');
        console.log('      Last sign in:', targetUser.last_sign_in_at || 'Never');
      } else {
        console.log('   ⚠️ User not found in auth.users');
      }
    }
  } catch (error) {
    console.log('   ❌ Auth users check error:', error.message);
  }
  console.log('');

  // Recommendations
  console.log('5. Recommendations:');
  console.log('   - If user exists in database but not in auth.users, recreate the user');
  console.log('   - If user exists in auth.users but email not confirmed, confirm email');
  console.log('   - If connection fails, check environment variables');
  console.log('   - If APIs return 401, check if cookies are being sent correctly');
  console.log('');

  console.log('6. Next Steps:');
  console.log('   Run: node scripts/fix-auth-session.js');
  console.log('   Or: node scripts/create-test-user.js');
}

diagnoseAuthIssue().catch(console.error); 