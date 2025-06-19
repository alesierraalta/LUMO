#!/usr/bin/env node

/**
 * Create Supabase Root User Script
 * 
 * Este script crea el usuario root completo en Supabase:
 * 1. Registra en Supabase Auth (auth.users)
 * 2. Sincroniza con tabla personalizada (public.users)
 * 3. Asigna rol ADMIN
 * 4. Funciona en DEV y PROD
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración del usuario root
const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';
const ROOT_NAME = 'Alejandro Sierra (ROOT)';

// Detectar ambiente
const isDev = process.env.NODE_ENV !== 'production';
const environment = isDev ? 'DEV' : 'PROD';

// Configuración de Supabase
const supabaseUrl = isDev 
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL)
  : (process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabaseServiceKey = isDev
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY)
  : (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log(`🔐 Creating Supabase Root User - ${environment} Environment`);
console.log(`📍 Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL (or environment-specific)');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (or environment-specific)');
  process.exit(1);
}

// Cliente con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSupabaseRootUser() {
  try {
    console.log('\n🔍 Step 1: Checking if user exists in Supabase Auth...');
    
    // Verificar si el usuario ya existe en auth.users
    const { data: existingAuthUser, error: authCheckError } = await supabase.auth.admin.listUsers();
    
    if (authCheckError) {
      console.error('❌ Error checking auth users:', authCheckError.message);
      return;
    }

    const authUser = existingAuthUser.users.find(user => user.email === ROOT_EMAIL);
    
    if (authUser) {
      console.log('✅ User already exists in Supabase Auth:', authUser.id);
    } else {
      console.log('⚠️ User not found in Supabase Auth, creating...');
      
      // Crear usuario en Supabase Auth
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: ROOT_EMAIL,
        password: ROOT_PASSWORD,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          name: ROOT_NAME,
          role: 'ADMIN'
        }
      });

      if (createAuthError) {
        console.error('❌ Error creating user in Supabase Auth:', createAuthError.message);
        return;
      }

      console.log('✅ User created in Supabase Auth:', newAuthUser.user.id);
    }

    console.log('\n🔍 Step 2: Checking roles in public.roles...');
    
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

    console.log('\n🔍 Step 3: Syncing with public.users table...');
    
    // Verificar si el usuario existe en public.users
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', ROOT_EMAIL)
      .single();

    if (existingUser) {
      console.log('✅ User exists in public.users, updating...');
      
      // Actualizar usuario existente
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
        console.error('❌ Error updating user in public.users:', updateError.message);
      } else {
        console.log('✅ User updated in public.users');
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
        console.log('✅ User created in public.users');
      }
    }

    console.log('\n🧪 Step 4: Testing authentication...');
    
    // Probar autenticación con cliente normal
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey);
    
    const { data: authTest, error: authTestError } = await testClient.auth.signInWithPassword({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD
    });

    if (authTestError) {
      console.error('❌ Authentication test failed:', authTestError.message);
    } else {
      console.log('✅ Authentication test successful!');
      console.log('   User ID:', authTest.user.id);
      console.log('   Email:', authTest.user.email);
      
      // Cerrar sesión de prueba
      await testClient.auth.signOut();
    }

    console.log('\n📋 Step 5: Final verification...');
    
    // Verificación final
    const { data: finalUsers } = await supabase
      .from('users')
      .select('email, name, is_active, roles(name)')
      .eq('role_id', adminRole.id);

    console.log('📊 Final admin users:');
    finalUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Role: ${user.roles.name} - Active: ${user.is_active}`);
    });

    console.log('\n🎉 SUCCESS: Root user created and configured!');
    console.log(`✅ ${environment} environment ready for login`);
    console.log(`📧 Email: ${ROOT_EMAIL}`);
    console.log(`🔑 Password: ${ROOT_PASSWORD}`);
    console.log('🚀 You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating Supabase root user:', error);
  }
}

// Ejecutar script
createSupabaseRootUser().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 