import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';
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
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.role.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    if (!prisma) {
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
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Find the role
    const role = await prisma.role.findUnique({
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
      await prisma.rolePermission.upsert({
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
      await prisma.rolePermission.deleteMany({
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
    console.error('Update role permission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 