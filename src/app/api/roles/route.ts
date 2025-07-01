import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get all roles from database
    const roles = await db.role.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Simple authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    // Validation
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await db.role.findUnique({
      where: { name: name.toUpperCase() }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 400 }
      );
    }

    // Create new role
    const newRole = await db.role.create({
      data: {
        name: name.toUpperCase(),
        description,
        permissions: JSON.stringify(permissions || []),
        isSystem: false,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      role: newRole
    });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Simple authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, permissions, isActive } = body;

    // Check if role exists and is not a system role
    const existingRole = await db.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system roles' },
        { status: 400 }
      );
    }

    // Update role
    const updatedRole = await db.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(description && { description }),
        ...(permissions && { permissions: JSON.stringify(permissions) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Simple authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists and is not a system role
    const existingRole = await db.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Check if role is being used by any users
    const usersWithRole = await db.user.findMany({
      where: { roleId: roleId }
    });

    if (usersWithRole.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role - it is assigned to users' },
        { status: 400 }
      );
    }

    // Delete role
    await db.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 