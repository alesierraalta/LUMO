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
    
    // First, check if tables exist
    console.log('📋 Checking if tables exist...');
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('does not exist')) {
      console.log('❌ Tables do not exist in Supabase!');
      console.log('');
      console.log('🚨 ACCIÓN REQUERIDA:');
      console.log('1. Ve a https://ubjujxtvlubxowsphvuk.supabase.co');
      console.log('2. Ve a SQL Editor');
      console.log('3. Ejecuta el contenido completo de: supabase-migration.sql');
      console.log('4. Redeploy la aplicación');
      return;
    }
    
    console.log('✅ Tables exist in Supabase');
    
    // Check if admin user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com')
      .single();
    
    if (existingUser) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: alesierraalta@gmail.com');
      console.log('🔑 Password: admin123');
      return;
    }
    
    if (userError && !userError.message.includes('No rows found')) {
      console.log('⚠️ Error checking existing user:', userError.message);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user (without role_id for now, will be updated after role is created)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: 'alesierraalta@gmail.com',
        password: hashedPassword,
        name: 'Alejandro Sierra (ROOT)',
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
    console.log('');
    console.log('🎉 Setup complete! You can now login.');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    
    // Provide helpful error guidance
    if (error.message.includes('does not exist')) {
      console.log('');
      console.log('🚨 TABLES MISSING IN SUPABASE!');
      console.log('Ejecuta el SQL migration script primero.');
    }
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  setupSupabaseAdmin();
}

module.exports = { setupSupabaseAdmin };
