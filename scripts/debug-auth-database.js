#!/usr/bin/env node

/**
 * LUMO - Database Authentication Debugging Script
 * This script debugs the exact database queries and logic used in getCurrentUserFromToken
 * to identify why the user is getting 403 Forbidden instead of ADMIN access.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - using production environment
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';

// Test credentials
const TEST_EMAIL = 'alesierraalta@gmail.com';
const TEST_PASSWORD = 'admin123';

console.log('🔍 LUMO Database Authentication Debugging');
console.log('========================================');

async function debugDatabaseAuth() {
  try {
    // 1. Create Supabase client
    console.log('\n1️⃣ Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created');

    // 2. Authenticate user
    console.log('\n2️⃣ Authenticating user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('📧 User email:', authData.user.email);
    console.log('🆔 User ID:', authData.user.id);
    console.log('🔑 Access token length:', authData.session.access_token.length);

    // 3. Test direct users table query
    console.log('\n3️⃣ Testing users table query...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_EMAIL);

    if (usersError) {
      console.log('❌ Users query failed:', usersError.message);
      console.log('📄 Error details:', usersError);
    } else {
      console.log('✅ Users query successful');
      console.log('👤 User records found:', usersData.length);
      if (usersData.length > 0) {
        console.log('📊 User data:', JSON.stringify(usersData[0], null, 2));
      }
    }

    // 4. Test roles table query
    console.log('\n4️⃣ Testing roles table query...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) {
      console.log('❌ Roles query failed:', rolesError.message);
      console.log('📄 Error details:', rolesError);
    } else {
      console.log('✅ Roles query successful');
      console.log('📋 Roles found:', rolesData.length);
      rolesData.forEach(role => {
        console.log(`   - ${role.name} (${role.id}): ${role.description}`);
      });
    }

    // 5. Test the exact join query used in getCurrentUserFromToken
    console.log('\n5️⃣ Testing exact join query from getCurrentUserFromToken...');
    const { data: joinData, error: joinError } = await supabase
      .from('users')
      .select(`
        name, 
        is_active, 
        roles!inner(name)
      `)
      .eq('email', TEST_EMAIL)
      .single();

    if (joinError) {
      console.log('❌ Join query failed:', joinError.message);
      console.log('📄 Error details:', joinError);
      console.log('🔍 This is likely why the user is getting 403 Forbidden!');
    } else {
      console.log('✅ Join query successful');
      console.log('📊 Join result:', JSON.stringify(joinData, null, 2));
      console.log('👤 User name:', joinData.name);
      console.log('✅ Is active:', joinData.is_active);
      console.log('🎭 Role name:', joinData.roles?.name);
    }

    // 6. Test alternative query without inner join
    console.log('\n6️⃣ Testing alternative query without inner join...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        name, 
        is_active, 
        role_id
      `)
      .eq('email', TEST_EMAIL)
      .single();

    if (userError) {
      console.log('❌ User query failed:', userError.message);
    } else {
      console.log('✅ User query successful');
      console.log('📊 User data:', JSON.stringify(userData, null, 2));
      
      if (userData.role_id) {
        console.log('\n🔍 Looking up role by ID...');
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', userData.role_id)
          .single();

        if (roleError) {
          console.log('❌ Role lookup failed:', roleError.message);
        } else {
          console.log('✅ Role lookup successful');
          console.log('🎭 Role details:', JSON.stringify(roleData, null, 2));
        }
      }
    }

    // 7. Test fallback logic simulation
    console.log('\n7️⃣ Testing fallback logic simulation...');
    let userRole = 'USER';
    let userName = authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User';
    let isActive = true;

    if (joinError) {
      console.log('⚠️ Join query failed, testing fallback logic...');
      if (authData.user.email === 'alesierraalta@gmail.com') {
        console.log('🔑 Applying admin role for root user (fallback)');
        userRole = 'ADMIN';
      }
    }

    console.log('📊 Final user object would be:');
    console.log({
      id: authData.user.id,
      email: authData.user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    });

    // 8. Test API authorization logic
    console.log('\n8️⃣ Testing API authorization logic...');
    const canAccessRoles = userRole === 'ADMIN' || userRole === 'MANAGER';
    console.log('🔐 Can access roles API:', canAccessRoles);
    
    if (!canAccessRoles) {
      console.log('❌ This explains the 403 Forbidden error!');
      console.log('💡 User role:', userRole);
      console.log('💡 Required roles: ADMIN or MANAGER');
    } else {
      console.log('✅ User should be able to access roles API');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('📄 Stack trace:', error.stack);
  }
}

// Run the debugging
debugDatabaseAuth().then(() => {
  console.log('\n✅ Database Authentication Debugging Complete');
  console.log('============================================');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debugging failed:', error);
  process.exit(1);
}); 