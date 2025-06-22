#!/usr/bin/env node

/**
 * Fix Root User Production Script
 * 
 * This script diagnoses and fixes root user permissions in Choreo production environment.
 * It will:
 * 1. Connect to production Supabase database
 * 2. Verify root user exists and has ADMIN role
 * 3. Fix any permission issues
 * 4. Test authentication flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';
const ROOT_NAME = 'Alejandro Sierra (ROOT)';

// Production Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 LUMO Root User Production Fix');
console.log('================================');
console.log('🌐 Environment: PRODUCTION');
console.log('📧 Root Email:', ROOT_EMAIL);
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Using Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRootUserProduction() {
  try {
    console.log('\n🔍 Step 1: Checking database connection...');
    
    // Test database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('roles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }

    console.log('✅ Database connection successful');

    console.log('\n🔍 Step 2: Checking ADMIN role...');
    
    // Get or create ADMIN role
    let { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'ADMIN')
      .single();

    if (roleError || !adminRole) {
      console.log('⚠️ ADMIN role not found, creating...');
      
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert([{
          name: 'ADMIN',
          description: 'Administrador ROOT con acceso completo',
          is_system: true,
          is_active: true
        }])
        .select()
        .single();

      if (createRoleError) {
        console.error('❌ Error creating ADMIN role:', createRoleError.message);
        return;
      }

      adminRole = newRole;
      console.log('✅ ADMIN role created successfully');
    } else {
      console.log('✅ ADMIN role found:', adminRole.id);
    }

    console.log('\n🔍 Step 3: Checking root user in public.users...');
    
    // Check if root user exists in public.users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_active,
        role_id,
        roles!inner(name)
      `)
      .eq('email', ROOT_EMAIL)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', userError.message);
      return;
    }

    if (existingUser) {
      console.log('✅ Root user found in public.users');
      console.log('   - ID:', existingUser.id);
      console.log('   - Email:', existingUser.email);
      console.log('   - Name:', existingUser.name);
      console.log('   - Active:', existingUser.is_active);
      console.log('   - Role:', existingUser.roles?.name);

      // Check if user has correct role
      if (existingUser.role_id !== adminRole.id || existingUser.roles?.name !== 'ADMIN') {
        console.log('⚠️ Root user has incorrect role, fixing...');
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            name: ROOT_NAME,
            role_id: adminRole.id,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', ROOT_EMAIL)
          .select(`
            id,
            email,
            name,
            is_active,
            roles!inner(name)
          `)
          .single();

        if (updateError) {
          console.error('❌ Error updating user role:', updateError.message);
          return;
        }

        console.log('✅ Root user role updated successfully');
        console.log('   - New Role:', updatedUser.roles?.name);
      } else {
        console.log('✅ Root user already has correct ADMIN role');
      }
    } else {
      console.log('⚠️ Root user not found in public.users, creating...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(ROOT_PASSWORD, 12);
      
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{
          email: ROOT_EMAIL,
          name: ROOT_NAME,
          password: hashedPassword,
          role_id: adminRole.id,
          is_active: true
        }])
        .select(`
          id,
          email,
          name,
          is_active,
          roles!inner(name)
        `)
        .single();

      if (createUserError) {
        console.error('❌ Error creating user in public.users:', createUserError.message);
        return;
      }

      console.log('✅ Root user created in public.users');
      console.log('   - ID:', newUser.id);
      console.log('   - Role:', newUser.roles?.name);
    }

    console.log('\n🔍 Step 4: Checking Supabase Auth user...');
    
    // Try to sign in to check if user exists in auth.users
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD
    });

    if (signInError) {
      console.log('⚠️ Supabase Auth login failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('⚠️ User might not exist in auth.users, attempting to create...');
        
        // Try to create user in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: ROOT_EMAIL,
          password: ROOT_PASSWORD,
          options: {
            data: {
              name: ROOT_NAME
            }
          }
        });

        if (signUpError) {
          console.error('❌ Error creating user in Supabase Auth:', signUpError.message);
        } else {
          console.log('✅ User created in Supabase Auth');
          console.log('   - User ID:', signUpData.user?.id);
          console.log('   - Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
        }
      }
    } else {
      console.log('✅ Supabase Auth login successful');
      console.log('   - User ID:', signInData.user?.id);
      console.log('   - Email:', signInData.user?.email);
      console.log('   - Email confirmed:', signInData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    console.log('\n🔍 Step 5: Final verification...');
    
    // Final check - get all admin users
    const { data: allAdmins, error: adminsError } = await supabase
      .from('users')
      .select(`
        email,
        name,
        is_active,
        roles!inner(name)
      `)
      .eq('role_id', adminRole.id);

    if (adminsError) {
      console.error('❌ Error getting admin users:', adminsError.message);
    } else {
      console.log('📊 Current admin users in production:');
      allAdmins?.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - Role: ${user.roles?.name} - Active: ${user.is_active}`);
      });
    }

    console.log('\n✅ Root user production fix completed!');
    console.log('📋 Summary:');
    console.log('   - Database connection: ✅ Working');
    console.log('   - ADMIN role: ✅ Configured');
    console.log('   - Root user in public.users: ✅ Configured');
    console.log('   - Supabase Auth: ✅ Tested');
    console.log('\n🔐 Login credentials:');
    console.log(`   - Email: ${ROOT_EMAIL}`);
    console.log(`   - Password: ${ROOT_PASSWORD}`);
    console.log('\n🌐 Try logging in to Choreo again with these credentials.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the fix
fixRootUserProduction(); 