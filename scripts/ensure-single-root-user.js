#!/usr/bin/env node

/**
 * Ensure Single Root User Script
 * 
 * This script ensures that each database (dev/prod) has exactly ONE root user:
 * - Email: alesierraalta@gmail.com
 * - Password: admin123
 * - Role: ADMIN
 * 
 * It will:
 * 1. Remove any duplicate admin users
 * 2. Ensure only alesierraalta@gmail.com has ADMIN role
 * 3. Update password if needed
 * 4. Work for both DEV and PROD environments
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Root user configuration
const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';
const ROOT_NAME = 'Alejandro Sierra (ROOT)';

// Environment detection
const isDev = process.env.NODE_ENV !== 'production';
const environment = isDev ? 'DEV' : 'PROD';

// Supabase configuration - auto-detect environment
const supabaseUrl = isDev 
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL)
  : (process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabaseKey = isDev
  ? (process.env.SUPABASE_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : (process.env.SUPABASE_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log(`🔐 Ensuring Single Root User - ${environment} Environment`);
console.log(`📍 Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL (or environment-specific)');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY (or environment-specific)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureSingleRootUser() {
  try {
    console.log('\n🔍 Step 1: Checking current admin users...');
    
    // Get ADMIN role
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'ADMIN')
      .single();

    if (!adminRole) {
      console.error('❌ ADMIN role not found! Please run the SQL migration script first.');
      return;
    }

    console.log('✅ ADMIN role found:', adminRole.id);

    // Find all users with ADMIN role
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role_id', adminRole.id);

    if (usersError) {
      console.error('❌ Error querying admin users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${adminUsers.length} admin user(s)`);

    // Find the root user
    const rootUser = adminUsers.find(user => user.email === ROOT_EMAIL);
    const otherAdmins = adminUsers.filter(user => user.email !== ROOT_EMAIL);

    console.log('\n🧹 Step 2: Cleaning up duplicate admin users...');
    
    // Remove other admin users (demote to USER role)
    if (otherAdmins.length > 0) {
      // Get USER role
      const { data: userRole } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'USER')
        .single();

      if (userRole) {
        for (const admin of otherAdmins) {
          console.log(`⬇️ Demoting admin user: ${admin.email}`);
          
          const { error: demoteError } = await supabase
            .from('users')
            .update({ 
              role_id: userRole.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', admin.id);

          if (demoteError) {
            console.error(`❌ Error demoting ${admin.email}:`, demoteError.message);
          } else {
            console.log(`✅ Demoted ${admin.email} to USER role`);
          }
        }
      }
    } else {
      console.log('✅ No duplicate admin users found');
    }

    console.log('\n👑 Step 3: Ensuring root user exists and is configured correctly...');

    if (rootUser) {
      console.log('✅ Root user found, updating configuration...');
      
      // Hash password for comparison/update
      const hashedPassword = await bcrypt.hash(ROOT_PASSWORD, 12);
      
      // Update root user to ensure correct configuration
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: ROOT_NAME,
          password: hashedPassword,
          role_id: adminRole.id,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', rootUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating root user:', updateError.message);
      } else {
        console.log('✅ Root user updated successfully');
        console.log(`   📧 Email: ${ROOT_EMAIL}`);
        console.log(`   🔑 Password: ${ROOT_PASSWORD}`);
        console.log(`   👤 Name: ${ROOT_NAME}`);
        console.log(`   🛡️ Role: ADMIN`);
      }
    } else {
      console.log('⚠️ Root user not found, creating...');
      
      const hashedPassword = await bcrypt.hash(ROOT_PASSWORD, 12);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: ROOT_EMAIL,
          name: ROOT_NAME,
          password: hashedPassword,
          role_id: adminRole.id,
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating root user:', createError.message);
      } else {
        console.log('✅ Root user created successfully');
        console.log(`   📧 Email: ${ROOT_EMAIL}`);
        console.log(`   🔑 Password: ${ROOT_PASSWORD}`);
        console.log(`   👤 Name: ${ROOT_NAME}`);
        console.log(`   🛡️ Role: ADMIN`);
      }
    }

    console.log('\n📋 Step 4: Final verification...');
    
    // Verify final state
    const { data: finalAdminUsers } = await supabase
      .from('users')
      .select('email, name, is_active')
      .eq('role_id', adminRole.id);

    console.log('📊 Final admin users count:', finalAdminUsers.length);
    finalAdminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Active: ${user.is_active}`);
    });

    if (finalAdminUsers.length === 1 && finalAdminUsers[0].email === ROOT_EMAIL) {
      console.log('\n🎉 SUCCESS: Single root user configuration complete!');
      console.log(`✅ ${environment} database has exactly ONE admin user: ${ROOT_EMAIL}`);
    } else {
      console.log('\n⚠️ WARNING: Multiple admin users still exist');
    }

  } catch (error) {
    console.error('❌ Error ensuring single root user:', error);
  }
}

// Run the script
ensureSingleRootUser().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 