/**
 * Debug Authentication Issue Script
 * ================================
 * 
 * This script helps debug Supabase authentication issues
 * when getting "Invalid login credentials" errors.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugAuthIssue() {
  console.log('🔍 Debug Authentication Issue');
  console.log('============================\n');

  // 1. Check environment configuration
  console.log('1. Environment Configuration:');
  console.log(`   ✅ Supabase URL: ${supabaseUrl ? 'Found' : '❌ Missing'}`);
  console.log(`   ✅ Anon Key: ${supabaseAnonKey ? 'Found' : '❌ Missing'}`);
  console.log(`   ✅ Service Key: ${serviceRoleKey ? 'Found' : '❌ Missing'}\n`);

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.log('❌ Missing required environment variables. Check .env.local file.');
    return;
  }

  // 2. Create Supabase clients
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('2. Supabase Client Status:');
  console.log('   ✅ Client created successfully\n');

  // 3. Check users in auth table
  console.log('3. Users in Supabase Auth:');
  try {
    const { data: users, error } = await adminSupabase
      .from('auth.users')
      .select('email, email_confirmed_at, created_at, last_sign_in_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log(`   ❌ Error fetching users: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`     - ${user.email} (confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'})`);
      });
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }

  console.log('\n4. Authentication Test Instructions:');
  console.log('   To test authentication, try the following:');
  console.log('   \n   📧 Email: alesierraalta@gmail.com');
  console.log('   🔑 Password: [Use the correct password]');
  console.log('\n   Common issues:');
  console.log('   • Password is case-sensitive');
  console.log('   • Make sure there are no extra spaces');
  console.log('   • Try copying and pasting the password');
  console.log('   • Check if Caps Lock is on');

  console.log('\n5. Password Reset Option:');
  console.log('   If you\'ve forgotten the password, you can reset it:');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail('alesierraalta@gmail.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });
    
    if (error) {
      console.log(`   ❌ Password reset error: ${error.message}`);
    } else {
      console.log('   ✅ Password reset email sent to alesierraalta@gmail.com');
      console.log('   📧 Check your email for reset instructions');
    }
  } catch (err) {
    console.log(`   ❌ Error sending reset email: ${err.message}`);
  }

  console.log('\n6. Alternative Solutions:');
  console.log('   • Check the browser developer console for more error details');
  console.log('   • Clear browser cache and cookies');
  console.log('   • Try incognito/private browsing mode');
  console.log('   • Verify the Supabase project is active and healthy');
}

// Run the debug script
debugAuthIssue()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });