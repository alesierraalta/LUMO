#!/usr/bin/env node

/**
 * Simple Root User Creation Script
 * 
 * Este script crea el usuario root usando Supabase signUp normal
 * y luego actualiza su rol a ADMIN en la tabla personalizada
 */

require('dotenv').config({ path: 'supabase.env' });
const { createClient } = require('@supabase/supabase-js');

// Configuración del usuario root
const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';
const ROOT_NAME = 'Alejandro Sierra (ROOT)';

// Configuración de Supabase (DEV)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔐 Creating Root User with Supabase Auth');
console.log('📍 Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRootUser() {
  try {
    console.log('\n🔍 Step 1: Attempting to sign up user in Supabase Auth...');
    
    // Intentar registrar usuario en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD,
      options: {
        data: {
          name: ROOT_NAME,
          role: 'ADMIN'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ User already exists in Supabase Auth');
      } else {
        console.error('❌ Error signing up user:', signUpError.message);
        return;
      }
    } else {
      console.log('✅ User signed up successfully in Supabase Auth');
      console.log('   User ID:', signUpData.user?.id);
    }

    console.log('\n🔍 Step 2: Testing login...');
    
    // Probar login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD
    });

    if (loginError) {
      console.error('❌ Login test failed:', loginError.message);
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️ Email needs to be confirmed. Checking if we can update...');
        
        // Si el email no está confirmado, intentar confirmar automáticamente
        // Esto requeriría service role key, así que vamos a intentar otro enfoque
      }
      
      return;
    } else {
      console.log('✅ Login test successful!');
      console.log('   User ID:', loginData.user.id);
      console.log('   Email:', loginData.user.email);
      console.log('   Email confirmed:', loginData.user.email_confirmed_at ? 'Yes' : 'No');
    }

    console.log('\n🔍 Step 3: Checking public.users table...');
    
    // Obtener rol ADMIN
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'ADMIN')
      .single();

    if (!adminRole) {
      console.error('❌ ADMIN role not found in public.roles');
      return;
    }

    console.log('✅ ADMIN role found:', adminRole.id);

    // Verificar si el usuario existe en public.users
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', ROOT_EMAIL)
      .single();

    if (existingUser) {
      console.log('✅ User exists in public.users, updating role...');
      
      // Actualizar rol a ADMIN
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: ROOT_NAME,
          role_id: adminRole.id,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', ROOT_EMAIL)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating user role:', updateError.message);
      } else {
        console.log('✅ User role updated to ADMIN');
      }
    } else {
      console.log('⚠️ User not found in public.users, creating...');
      
      // Crear usuario en public.users
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
        .select()
        .single();

      if (createUserError) {
        console.error('❌ Error creating user in public.users:', createUserError.message);
      } else {
        console.log('✅ User created in public.users with ADMIN role');
      }
    }

    console.log('\n📋 Step 4: Final verification...');
    
    // Verificación final
    const { data: finalUsers } = await supabase
      .from('users')
      .select('email, name, is_active, roles(name)')
      .eq('role_id', adminRole.id);

    console.log('📊 Final admin users:');
    finalUsers?.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Role: ${user.roles?.name} - Active: ${user.is_active}`);
    });

    // Cerrar sesión
    await supabase.auth.signOut();

    console.log('\n🎉 SUCCESS: Root user setup complete!');
    console.log(`📧 Email: ${ROOT_EMAIL}`);
    console.log(`🔑 Password: ${ROOT_PASSWORD}`);
    console.log('🚀 Try logging in at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating root user:', error);
  }
}

// Ejecutar script
createRootUser().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 