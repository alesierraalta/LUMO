import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createServerClient();
    
    let query = supabase
      .from('locations')
      .select('id, name, description, is_active, created_at, updated_at')
      .order('name', { ascending: true });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and execute query
    const { data: locations, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: total } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    // Transform to match expected format
    const transformedLocations = locations?.map(location => ({
      id: location.id,
      name: location.name,
      description: location.description,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      locations: transformedLocations,
      total: total || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const supabase = await createServerClient();
    
    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        name: data.name,
        description: data.description,
        is_active: data.isActive !== false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create location' },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const transformedLocation = {
      id: location.id,
      name: location.name,
      description: location.description,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };

    return NextResponse.json({
      success: true,
      location: transformedLocation
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
} 