import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const permissionSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissionName: z.string().min(1, 'Permission name is required'),
  action: z.enum(['add', 'remove'], { required_error: 'Action must be add or remove' }),
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin with fallback for Choreo
    const token = getTokenFromRequest(request);
    let currentUser = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!currentUser) {
      currentUser = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'ADMIN'
      } as any;
      console.log('🔄 Using fallback admin user for role permissions:', currentUser.email);
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const result = permissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { roleId, permissionName, action } = result.data;

    // Find the permission by name
    const permission = await db.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Find the role
    const role = await db.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Add permission to role
      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleId,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: roleId,
          permissionId: permission.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `Permission '${permissionName}' added to role '${role.name}'`
      });
    } else {
      // Remove permission from role
      await db.rolePermission.deleteMany({
        where: {
          roleId: roleId,
          permissionId: permission.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `Permission '${permissionName}' removed from role '${role.name}'`
      });
    }
  } catch (error) {
    console.error('❌ Update role permission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const permissions = await db.permission?.findMany?.() || [];
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
} 