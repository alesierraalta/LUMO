#!/usr/bin/env node

/**
 * LUMO User Permissions Debug Script
 * Debugs user permissions to identify why ADMIN user is getting "Acceso Denegado"
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 LUMO User Permissions Debug');
console.log('=' .repeat(60));

async function debugUserPermissions() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return false;
    }
    
    console.log('✅ Supabase environment variables found');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check user authentication
    console.log('\n1. Testing user authentication...');
    
    // Simulate the auth flow
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });
    
    if (signInError) {
      console.log('❌ Authentication failed:', signInError.message);
      return false;
    }
    
    console.log('✅ User authenticated successfully');
    console.log(`👤 User: ${signInData.user.email}`);
    
    // Test 2: Get user session and token
    console.log('\n2. Getting user session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ Failed to get session:', sessionError?.message);
      return false;
    }
    
    console.log('✅ Session retrieved');
    console.log(`🔑 Access Token: ${session.access_token.substring(0, 50)}...`);
    
    // Test 3: Call the /api/auth/supabase-me endpoint
    console.log('\n3. Testing /api/auth/supabase-me endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/supabase-me', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return false;
    }
    
    const userData = await response.json();
    console.log('✅ User data retrieved from API');
    console.log(`👤 Name: ${userData.name}`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔐 Role: ${userData.role}`);
    console.log(`✅ Active: ${userData.isActive}`);
    
    // Test 4: Check specific permissions
    console.log('\n4. Checking specific permissions...');
    
    // Import permissions logic (simulate client-side logic)
    const PERMISSIONS = {
      DASHBOARD_VIEW: { id: 'dashboard:view', name: 'Ver Dashboard' },
      INVENTORY_VIEW: { id: 'inventory:view', name: 'Ver Inventario' },
      CATEGORIES_VIEW: { id: 'categories:view', name: 'Ver Categorías' },
      LOCATIONS_VIEW: { id: 'locations:view', name: 'Ver Ubicaciones' },
      USERS_VIEW: { id: 'users:view', name: 'Ver Usuarios' },
      SETTINGS_VIEW: { id: 'settings:view', name: 'Ver Configuración' },
    };
    
    // Simulate hasPermission function for ADMIN
    const hasPermission = (user, permissionId) => {
      if (!user || !user.isActive) return false;
      if (user.role === 'ADMIN') return true; // ADMIN should have all permissions
      return false;
    };
    
    console.log('🔍 Permission check results:');
    for (const [key, permission] of Object.entries(PERMISSIONS)) {
      const hasAccess = hasPermission(userData, permission.id);
      console.log(`${hasAccess ? '✅' : '❌'} ${permission.name} (${permission.id}): ${hasAccess}`);
    }
    
    // Test 5: Check localStorage (simulate browser environment)
    console.log('\n5. Checking role permissions configuration...');
    
    // Check if there are any stored permissions that might override defaults
    console.log('ℹ️  Note: localStorage permissions would be checked in browser environment');
    console.log('ℹ️  ADMIN role should have all permissions by default');
    
    // Test 6: Summary
    console.log('\n6. Summary:');
    console.log(`✅ User authenticated: ${userData.email}`);
    console.log(`✅ Role: ${userData.role}`);
    console.log(`✅ Active: ${userData.isActive}`);
    console.log(`✅ Should have all permissions: ${userData.role === 'ADMIN'}`);
    
    if (userData.role === 'ADMIN' && userData.isActive) {
      console.log('\n🎯 DIAGNOSIS:');
      console.log('The user should have access to all pages.');
      console.log('If "Acceso Denegado" is still showing, the issue might be:');
      console.log('1. Frontend permission check logic error');
      console.log('2. User data not being passed correctly to permission functions');
      console.log('3. Component not receiving user data properly');
      console.log('4. Permission Guard component logic issue');
    }
    
    // Clean up
    await supabase.auth.signOut();
    console.log('\n✅ User signed out');
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

// Run the debug
debugUserPermissions()
  .then(success => {
    if (success) {
      console.log('\n🎉 Debug completed successfully');
    } else {
      console.log('\n💥 Debug failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }); 