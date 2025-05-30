import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, hasPageAccess } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Get current user
    const user = await getCurrentUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Crear objeto con permisos de páginas
    const pagePermissions = {
      dashboard: hasPageAccess(user, 'dashboard'),
      inventory: hasPageAccess(user, 'inventory'),
      settings: hasPageAccess(user, 'settings'),
      userManagement: hasPageAccess(user, 'user-management'),
    };

    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      permissions: user.role.permissions.map(rp => ({
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      pageAccess: pagePermissions,
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 