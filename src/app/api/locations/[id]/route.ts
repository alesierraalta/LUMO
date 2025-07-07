import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';
import { db } from '@/lib/db-supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    
    // Get location
    const { data: location, error } = await supabase
      .from('locations')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Get inventory items count
    const { count } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', id);

    // Transform to match expected format
    const transformedLocation = {
      id: location.id,
      name: location.name,
      description: location.description,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at,
      _count: {
        inventoryItems: count || 0
      }
    };

    return NextResponse.json({
      success: true,
      location: transformedLocation
    });

  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Location name is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if location exists
    const { data: existingLocation, error: checkError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Update location
    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, description, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      );
    }

    // Get inventory items count
    const { count } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', id);

    // Transform to match expected format
    const transformedLocation = {
      id: updatedLocation.id,
      name: updatedLocation.name,
      description: updatedLocation.description,
      isActive: updatedLocation.is_active,
      createdAt: updatedLocation.created_at,
      updatedAt: updatedLocation.updated_at,
      _count: {
        inventoryItems: count || 0
      }
    };

    return NextResponse.json({
      success: true,
      location: transformedLocation
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if location exists and get inventory count
    const location = await db.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if location has inventory items
    if (location._count.inventoryItems > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete location. It contains ${location._count.inventoryItems} inventory items. Please move or remove all items first.` 
        },
        { status: 400 }
      );
    }

    // Delete the location
    await db.location.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 