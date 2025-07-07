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

    const supabase = await createServerClient();
    
    // Simple query without pagination for now
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, description, is_active, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

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
      total: transformedLocations.length,
      limit: 50,
      offset: 0
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