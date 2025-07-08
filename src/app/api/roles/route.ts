import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Roles API: Starting authentication check...');
    
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    console.log('🔍 Roles API: Token extracted:', token ? 'Token found' : 'No token');
    console.log('🔑 Roles API: Token (first 50 chars):', token?.substring(0, 50) + '...');
    
    const user = token ? await getCurrentUserFromToken(token) : null;
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

    // Get all active roles
    const roles = await db.role.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('✅ Roles API: Found', roles.length, 'roles');

    return NextResponse.json({
      success: true,
      roles
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
    const user = token ? await getCurrentUserFromToken(token) : null;
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

    // Create the role
    const role = await db.role.create({
      data: {
        name: name.toUpperCase(),
        description: description || `${name} role`,
        isSystem,
        isActive: true
      }
    });

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