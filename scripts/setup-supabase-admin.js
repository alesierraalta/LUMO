#!/usr/bin/env node

/**
 * Setup Supabase Admin User for Choreo
 * This script runs automatically during deployment
 */

async function setupSupabaseAdmin() {
  console.log('🔧 Setting up Supabase admin user...');
  
  // Only run in production (Choreo) with Supabase
  const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || process.env.SUPABASE_URL;
  
  if (!isChoreo) {
    console.log('⚠️ Not running in Choreo. Skipping Supabase admin setup.');
    return;
  }
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not found. Skipping admin setup.');
    return;
  }
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const bcrypt = require('bcryptjs');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if admin user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com')
      .single();
    
    if (existingUser) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Get ADMIN role
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();
    
    if (!adminRole) {
      console.log('❌ ADMIN role not found. Please run the SQL migration first.');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: 'alesierraalta@gmail.com',
        password: hashedPassword,
        name: 'Alejandro Sierra (ROOT)',
        role_id: adminRole.id,
        is_active: true
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating admin user:', createError);
      return;
    }
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: alesierraalta@gmail.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  setupSupabaseAdmin();
}

module.exports = { setupSupabaseAdmin };
