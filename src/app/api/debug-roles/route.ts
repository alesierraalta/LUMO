import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-service-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Roles API: Starting...');
    
    // Get Supabase service client with admin privileges
    const supabase = createServiceSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service client configuration missing' },
        { status: 503 }
      );
    }

    // Get ALL roles (including inactive ones)
    console.log('📊 Debug Roles API: Fetching all roles...');
    const { data: allRoles, error: allError } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    console.log('📊 Debug Roles API: All roles result:', { allRoles, allError });

    if (allError) {
      console.error('❌ Debug Roles API: Error fetching all roles:', allError);
    }

    // Get only active roles
    console.log('📊 Debug Roles API: Fetching active roles...');
    const { data: activeRoles, error: activeError } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    console.log('📊 Debug Roles API: Active roles result:', { activeRoles, activeError });

    if (activeError) {
      console.error('❌ Debug Roles API: Error fetching active roles:', activeError);
    }

    // Check for basic roles
    const basicRoles = ['USER', 'MANAGER', 'ADMIN'];
    const existingRoles = allRoles?.map(r => r.name) || [];
    const missingRoles = basicRoles.filter(role => !existingRoles.includes(role));

    return NextResponse.json({
      success: true,
      debug: {
        totalRoles: allRoles?.length || 0,
        activeRoles: activeRoles?.length || 0,
        allRoles: allRoles || [],
        missingBasicRoles: missingRoles,
        hasUserRole: existingRoles.includes('USER'),
        hasManagerRole: existingRoles.includes('MANAGER'),
        hasAdminRole: existingRoles.includes('ADMIN')
      }
    });
  } catch (error) {
    console.error('❌ Debug Roles API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Create missing roles
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Roles API: Creating basic roles...');
    
    const supabase = createServiceSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service client configuration missing' },
        { status: 503 }
      );
    }

    const basicRoles = [
      { name: 'USER', description: 'Basic user with standard access', is_system: true },
      { name: 'MANAGER', description: 'Manager with elevated permissions', is_system: true },
      { name: 'ADMIN', description: 'Administrator with full access', is_system: true }
    ];

    const results = [];
    
    for (const role of basicRoles) {
      // Check if role exists
      const { data: existing } = await supabase
        .from('roles')
        .select('*')
        .eq('name', role.name)
        .single();

      if (!existing) {
        // Create the role
        const { data, error } = await supabase
          .from('roles')
          .insert({
            name: role.name,
            description: role.description,
            is_system: role.is_system,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          results.push({ role: role.name, success: false, error: error.message });
        } else {
          results.push({ role: role.name, success: true, data });
        }
      } else {
        // Update to ensure it's active
        const { data, error } = await supabase
          .from('roles')
          .update({ is_active: true })
          .eq('id', existing.id)
          .select()
          .single();

        results.push({ 
          role: role.name, 
          success: !error, 
          action: 'updated', 
          data: data || existing 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('❌ Debug Create Roles API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}