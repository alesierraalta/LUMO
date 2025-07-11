import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createServiceSupabaseClient } from '@/lib/supabase-service-client';
import { getCurrentUserFromToken, getTokenFromRequest, getCurrentUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Roles API: Starting authentication check...');
    
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    console.log('🔍 Roles API: Token extracted:', token ? 'Token found' : 'No token');
    
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('🔍 Roles API: User from token:', user ? `${user.email} (${user.role})` : 'No user');
    
    if (!user) {
      console.log('❌ Roles API: Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and MANAGER can view roles
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      console.log('❌ Roles API: Forbidden - user role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ Roles API: User authorized, fetching roles...');

    // Try to use service client first for admin operations
    const serviceClient = createServiceSupabaseClient();
    
    if (serviceClient) {
      console.log('🔑 Roles API: Using service client (bypasses RLS)');
      
      // Get all active roles using service client
      const { data: roles, error } = await serviceClient
        .from('roles')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Roles API: Service client error:', error);
        throw error;
      }

      console.log('✅ Roles API: Found', roles?.length || 0, 'roles via service client');

      return NextResponse.json({
        success: true,
        roles: roles || []
      });
    }

    // Fallback to regular client if service client not available
    console.log('⚠️ Roles API: Service client not available, using regular client');
    const supabase = await createServerClient();

    // Get all active roles from Supabase
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, description, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Roles API: Supabase error:', error);
      throw error;
    }

    console.log('✅ Roles API: Found', roles?.length || 0, 'roles');

    return NextResponse.json({
      success: true,
      roles: roles || []
    });
  } catch (error) {
    console.error('❌ Roles API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can create roles
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isSystem = false } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Get Supabase client
    const supabase = await createServerClient();

    // Create the role
    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name: name.toUpperCase(),
        description: description || `${name} role`,
        is_system: isSystem,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create role API error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      role
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Create role API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}