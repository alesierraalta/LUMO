import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const location = await db.location.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      location
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
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Location name is required' },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await db.location.findUnique({
      where: { id: params.id }
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Update location
    const updatedLocation = await db.location.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive)
      },
      include: {
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      location: updatedLocation
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
  { params }: { params: { id: string } }
) {
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

    // Check if location exists and get inventory count
    const location = await db.location.findUnique({
      where: { id: params.id },
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
      where: { id: params.id }
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