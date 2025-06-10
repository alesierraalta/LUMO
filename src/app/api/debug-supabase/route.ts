import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Starting Supabase diagnostic...');
    
    // Check environment variables
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_KEY;
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
        config: { hasSupabaseUrl, hasSupabaseKey }
      });
    }

    // Test Supabase connection
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Test 1: Check if tables exist
    console.log('🔍 Checking if tables exist...');
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .single();

    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('count')
      .single();

    // Test 2: Get all users
    console.log('🔍 Getting all users...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');

    // Test 3: Try to find specific admin user
    console.log('🔍 Looking for admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com')
      .single();

    // Test 4: Get all roles
    console.log('🔍 Getting all roles...');
    const { data: allRoles, error: allRolesError } = await supabase
      .from('roles')
      .select('*');

    return NextResponse.json({
      success: true,
      diagnostics: {
        config: { hasSupabaseUrl, hasSupabaseKey },
        tables: {
          users: { error: usersError?.message, exists: !usersError },
          roles: { error: rolesError?.message, exists: !rolesError }
        },
        data: {
          usersCount: allUsers?.length || 0,
          users: allUsers || [],
          adminUser: adminUser || null,
          adminError: adminError?.message,
          rolesCount: allRoles?.length || 0,
          roles: allRoles || []
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Supabase diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 