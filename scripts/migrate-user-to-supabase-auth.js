/**
 * Migrate User to Supabase Auth
 * =============================
 * 
 * This script migrates a user from the local users table
 * to Supabase Auth so they can login with signInWithPassword.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function migrateUserToSupabaseAuth(email, password) {
  console.log('🔄 Migrating User to Supabase Auth');
  console.log('==================================\n');

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // Create admin Supabase client (bypasses RLS)
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Check if user exists in local users table
    console.log(`1. Checking if user exists in local users table...`);
    const { data: localUser, error: localError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (localError || !localUser) {
      console.log(`❌ User ${email} not found in local users table`);
      return;
    }

    console.log(`✅ User found in local users table: ${email}`);
    console.log(`   Created: ${localUser.created_at}`);

    // 2. Check if user already exists in Supabase Auth
    console.log(`\n2. Checking if user exists in Supabase Auth...`);
    const { data: authUsers, error: authError } = await adminSupabase
      .from('auth.users')
      .select('*')
      .eq('email', email);

    if (authError) {
      console.log(`❌ Error checking auth users: ${authError.message}`);
      return;
    }

    if (authUsers && authUsers.length > 0) {
      console.log(`⚠️  User already exists in Supabase Auth`);
      return;
    }

    console.log(`✅ User not found in Supabase Auth - ready to migrate`);

    // 3. Create user in Supabase Auth
    console.log(`\n3. Creating user in Supabase Auth...`);
    const { data: newAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        migrated_from_legacy: true,
        migration_date: new Date().toISOString()
      }
    });

    if (createError) {
      console.log(`❌ Error creating user in Supabase Auth: ${createError.message}`);
      return;
    }

    console.log(`✅ User created successfully in Supabase Auth!`);
    console.log(`   Auth User ID: ${newAuthUser.user?.id}`);
    console.log(`   Email: ${newAuthUser.user?.email}`);
    console.log(`   Email Confirmed: ${newAuthUser.user?.email_confirmed_at ? 'Yes' : 'No'}`);

    // 4. Update local user record with auth_user_id
    console.log(`\n4. Linking local user with Supabase Auth ID...`);
    const { error: updateError } = await adminSupabase
      .from('users')
      .update({ 
        auth_user_id: newAuthUser.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.log(`⚠️  Warning: Could not update local user with auth_user_id: ${updateError.message}`);
    } else {
      console.log(`✅ Local user record updated with auth_user_id`);
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`\nThe user can now login with:`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: [the password you provided]`);
    console.log(`\n✅ User will be able to use signInWithPassword now.`);

  } catch (error) {
    console.error(`❌ Migration failed:`, error);
  }
}

// Get email and password from command line arguments or use defaults
const email = process.argv[2] || 'pradasamuel1@gmail.com';
const password = process.argv[3];

if (!password) {
  console.log('❌ Password is required');
  console.log('Usage: node migrate-user-to-supabase-auth.js <email> <password>');
  console.log('Example: node migrate-user-to-supabase-auth.js pradasamuel1@gmail.com $OswaldoLumo2025$');
  process.exit(1);
}

// Run the migration
migrateUserToSupabaseAuth(email, password)
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });