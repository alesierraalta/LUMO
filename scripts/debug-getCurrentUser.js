#!/usr/bin/env node

/**
 * Debug script to test getCurrentUser function behavior
 * Simulates server-side auth check that locations page uses
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

async function debugGetCurrentUser() {
  console.log('🧪 Debugging getCurrentUser Server Function...\n');
  
  try {
    // Step 1: Login to get a valid session
    console.log('1️⃣ Authenticating to get session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message || 'No session');
      return false;
    }

    console.log('✅ Authentication successful');
    const session = authData.session;

    // Step 2: Simulate getCurrentUser logic
    console.log('\n2️⃣ Simulating getCurrentUser server-side logic...');
    
    console.log('📊 Session data:');
    console.log('  - User ID:', session.user.id);
    console.log('  - Email:', session.user.email);
    console.log('  - User metadata:', JSON.stringify(session.user.user_metadata, null, 2));

    // Step 3: Test database query that getCurrentUser uses
    console.log('\n3️⃣ Testing database query for user data...');
    
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select(`
        name, 
        is_active, 
        roles!inner(name)
      `)
      .eq('email', session.user.email)
      .single();

    if (dbError) {
      console.log('❌ Database query failed:', dbError.message);
      console.log('🔍 Error details:', JSON.stringify(dbError, null, 2));
      
      // Test if user exists at all
      console.log('\n🔍 Checking if user exists in database...');
      const { data: userExists, error: existsError } = await supabase
        .from('users')
        .select('id, email, name, is_active, role_id')
        .eq('email', session.user.email);
      
      if (existsError) {
        console.log('❌ User existence check failed:', existsError.message);
      } else {
        console.log('📋 User data:', JSON.stringify(userExists, null, 2));
      }
    } else {
      console.log('✅ Database query successful');
      console.log('📋 User data:', JSON.stringify(dbUser, null, 2));
    }

    // Step 4: Simulate the complete getCurrentUser logic
    console.log('\n4️⃣ Simulating complete getCurrentUser logic...');
    
    let userRole = 'USER';
    let userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
    let isActive = true;

    if (!dbError && dbUser) {
      userName = dbUser.name || userName;
      isActive = dbUser.is_active;
      userRole = (dbUser.roles as any)?.name || 'USER';
      console.log('✅ Using database user data');
    } else {
      console.log('⚠️ Using fallback data');
      // For alesierraalta@gmail.com, default to ADMIN role
      if (session.user.email === 'alesierraalta@gmail.com') {
        userRole = 'ADMIN';
        console.log('🔑 Applied admin role for root user');
      }
    }

    const simulatedUser = {
      id: session.user.id,
      email: session.user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    console.log('👤 Simulated getCurrentUser result:');
    console.log(JSON.stringify(simulatedUser, null, 2));

    // Step 5: Test the critical issue
    console.log('\n5️⃣ Testing critical issue...');
    
    console.log('🚨 CRITICAL QUESTION: Is this user object truthy?');
    console.log('  - User object exists:', !!simulatedUser);
    console.log('  - Has email:', !!simulatedUser.email);
    console.log('  - Has role:', !!simulatedUser.role);
    console.log('  - Is active:', simulatedUser.isActive);

    if (simulatedUser && simulatedUser.email) {
      console.log('✅ getCurrentUser should return valid user');
      console.log('✅ Locations page should NOT redirect to login');
      return true;
    } else {
      console.log('❌ getCurrentUser would return null/undefined');
      console.log('❌ Locations page WOULD redirect to login');
      return false;
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function main() {
  console.log('🚀 getCurrentUser Debug Analysis\n');
  console.log('🎯 Understanding why locations page redirects to login\n');
  
  const success = await debugGetCurrentUser();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ getCurrentUser simulation: SUCCESSFUL');
    console.log('');
    console.log('🤔 IF getCurrentUser works in isolation but fails in app:');
    console.log('   1. Server-side context issue (cookies not available)');
    console.log('   2. Session not established when server component runs');
    console.log('   3. Race condition between middleware and server component');
    console.log('   4. Supabase SSR configuration issue');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Add extensive logging to getCurrentUser');
    console.log('   2. Check if session exists in server context');
    console.log('   3. Verify Supabase SSR cookie handling');
  } else {
    console.log('❌ getCurrentUser simulation: FAILED');
    console.log('   This explains why locations page redirects to login');
  }
  
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error); 