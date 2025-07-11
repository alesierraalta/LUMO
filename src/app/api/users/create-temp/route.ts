import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Creating temporary user...');
    
    // Check if SUPABASE_SERVICE_ROLE_KEY is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing service role key or URL' },
        { status: 503 }
      );
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'pradasamuel1@gmail.com',
      password: '$OswaldoLumo2025$',
      email_confirm: true,
      user_metadata: {
        name: 'OSWALDO PRADA'
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user!.id,
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
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
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
        id: authData.user!.id,
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