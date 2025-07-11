import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-service-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Creating temporary user...');
    
    // Create service client for admin operations
    const serviceClient = createServiceSupabaseClient();
    
    if (!serviceClient) {
      console.log('❌ Service client not available');
      return NextResponse.json(
        { success: false, error: 'Service client configuration missing' },
        { status: 503 }
      );
    }
    
    console.log('🔑 Using service client for admin operations');
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: 'pradasamuel1@gmail.com',
      password: '$OswaldoLumo2025$',
      user_metadata: {
        name: 'OSWALDO PRADA',
        roleId: '408782ff-7669-442f-a626-6eb9569d3f77' // USER role ID
      }
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }
    
    console.log('✅ Auth user created:', authData.user?.id);
    
    // Create user profile
    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .insert({
        id: authData.id,
        email: 'pradasamuel1@gmail.com',
        name: 'OSWALDO PRADA',
        password: 'temp_hash', // This will be handled by auth
        role_id: '408782ff-7669-442f-a626-6eb9569d3f77', // USER role ID
        is_active: true
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      // Try to delete the auth user
      await serviceClient.auth.admin.deleteUser(authData.id);
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 400 }
      );
    }
    
    console.log('✅ User profile created:', profile);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.id,
        email: 'pradasamuel1@gmail.com',
        name: 'OSWALDO PRADA'
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}