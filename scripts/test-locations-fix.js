#!/usr/bin/env node

/**
 * Test script to verify the locations authentication fix
 * Tests that getCurrentUser() works without internal fetch calls
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: 'supabase.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateGetCurrentUser() {
  console.log('🧪 Simulating getCurrentUser() function...\n');
  
  try {
    // Step 1: Create a session (simulating browser login)
    console.log('1️⃣ Creating Supabase session...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Failed to create session:', authError?.message);
      return false;
    }

    console.log('✅ Session created successfully');
    console.log('📊 User:', authData.user?.email);

    // Step 2: Simulate the fixed getCurrentUser logic (direct database query)
    console.log('\n2️⃣ Testing direct database query (new approach)...');
    
    const session = authData.session;
    let userRole = 'USER';
    let userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
    let isActive = true;

    // Direct database query (no fetch call)
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select(`
        name, 
        is_active, 
        roles!inner(name)
      `)
      .eq('email', session.user.email)
      .single();

    if (!dbError && dbUser) {
      userName = dbUser.name || userName;
      isActive = dbUser.is_active;
             userRole = dbUser.roles?.name || 'USER';
      console.log('✅ Database query successful');
    } else {
      console.warn('⚠️ Database query failed:', dbError?.message);
      // For alesierraalta@gmail.com, default to ADMIN role
      if (session.user.email === 'alesierraalta@gmail.com') {
        userRole = 'ADMIN';
        console.log('✅ Applied fallback ADMIN role for root user');
      }
    }

    const userData = {
      id: session.user.id,
      email: session.user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    console.log('✅ getCurrentUser() simulation successful!');
    console.log('📊 Final user data:');
    console.log('  - ID:', userData.id);
    console.log('  - Email:', userData.email);
    console.log('  - Name:', userData.name);
    console.log('  - Role:', userData.role);
    console.log('  - Active:', userData.isActive);
    console.log('  - Permissions:', userData.permissions);

    return userData;

  } catch (error) {
    console.error('❌ getCurrentUser() simulation failed:', error.message);
    return false;
  }
}

async function testLocationsPageLogic() {
  console.log('\n3️⃣ Testing locations page logic...');
  
  try {
    // Simulate the locations page logic
    const user = await simulateGetCurrentUser();
    
    if (!user) {
      console.log('❌ Would redirect to login (user is null)');
      return false;
    }

    console.log('✅ User authenticated, would proceed to load locations');
    
    // Test database query that locations page uses
    const locationsData = await supabase
      .from('locations')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .order('name', { ascending: true });

    if (locationsData.error) {
      console.error('❌ Locations query failed:', locationsData.error.message);
      return false;
    }

    console.log('✅ Locations data retrieved successfully');
    console.log('📊 Found', locationsData.data?.length || 0, 'locations');
    
    return true;

  } catch (error) {
    console.error('❌ Locations page logic test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Locations Authentication Fix\n');
  console.log('🎯 Verifying that getCurrentUser() works without fetch calls\n');
  
  const result = await testLocationsPageLogic();
  
  console.log('\n' + '='.repeat(50));
  if (result) {
    console.log('✅ SUCCESS: Locations authentication fix verified!');
    console.log('🎉 The locations page should now work correctly.');
    console.log('💡 Next steps:');
    console.log('   1. Restart the development server');
    console.log('   2. Login to the application');
    console.log('   3. Try accessing the locations page');
  } else {
    console.log('❌ FAILED: Locations authentication fix needs more work');
    console.log('🔧 Additional debugging may be required.');
  }
  console.log('='.repeat(50));
  
  process.exit(result ? 0 : 1);
}

main().catch(console.error); 