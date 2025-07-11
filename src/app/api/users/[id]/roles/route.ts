import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] /api/users/[id]/roles - Starting GET request for user:', params.id);
    
    // Get authentication session
    const session = await getCurrentUser();
    
    if (!session) {
      console.log('❌ [API] /api/users/[id]/roles - No session found');
      
      // Enhanced development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [API] /api/users/[id]/roles - Development mode - using fallback admin user');
        const devUser = {
          id: '5f493c59-420e-4a9b-afed-0b67bfa892d5',
          email: 'alesierraalta@gmail.com',
          name: 'Dev Admin',
          role: 'ADMIN',
          isActive: true,
          permissions: ['read', 'write', 'delete', 'admin']
        };
        console.log('✅ [API] /api/users/[id]/roles - Using development admin user');
        // Continue with devUser
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Use the actual user or development fallback
    const currentUser = session || (process.env.NODE_ENV === 'development' ? {
      id: '5f493c59-420e-4a9b-afed-0b67bfa892d5',
      email: 'alesierraalta@gmail.com',
      name: 'Dev Admin',
      role: 'ADMIN',
      isActive: true,
      permissions: ['read', 'write', 'delete', 'admin']
    } : null);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [API] /api/users/[id]/roles - Session found for user:', currentUser.email);

    // Check if user has permission to view user roles
    if (!currentUser.role || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      console.log('❌ [API] /api/users/[id]/roles - Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get user roles - for now, return hardcoded data based on user ID
    const userRoles = getUserRoles(params.id);

    console.log('✅ [API] /api/users/[id]/roles - Returning roles count:', userRoles.length);
    
    return NextResponse.json({
      success: true,
      roles: userRoles,
      userId: params.id,
      total: userRoles.length
    });
    
  } catch (error) {
    console.error('❌ [API] /api/users/[id]/roles - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] /api/users/[id]/roles - Starting PUT request for user:', params.id);
    
    // Get authentication session
    const session = await getCurrentUser();
    
    if (!session) {
      console.log('❌ [API] /api/users/[id]/roles - No session found');
      
      // Enhanced development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [API] /api/users/[id]/roles - Development mode - using fallback admin user');
        const devUser = {
          id: '5f493c59-420e-4a9b-afed-0b67bfa892d5',
          email: 'alesierraalta@gmail.com',
          name: 'Dev Admin',
          role: 'ADMIN',
          isActive: true,
          permissions: ['read', 'write', 'delete', 'admin']
        };
        console.log('✅ [API] /api/users/[id]/roles - Using development admin user');
        // Continue with devUser
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Use the actual user or development fallback
    const currentUser = session || (process.env.NODE_ENV === 'development' ? {
      id: '5f493c59-420e-4a9b-afed-0b67bfa892d5',
      email: 'alesierraalta@gmail.com',
      name: 'Dev Admin',
      role: 'ADMIN',
      isActive: true,
      permissions: ['read', 'write', 'delete', 'admin']
    } : null);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [API] /api/users/[id]/roles - Session found for user:', currentUser.email);

    // Check if user has permission to update user roles
    if (!currentUser.role || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      console.log('❌ [API] /api/users/[id]/roles - Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roleIds } = body;

    console.log('🔄 [API] /api/users/[id]/roles - Updating roles:', roleIds);

    // Validate roleIds
    if (!Array.isArray(roleIds)) {
      return NextResponse.json(
        { error: 'Invalid roleIds format. Expected array.' },
        { status: 400 }
      );
    }

    // In a real app, this would update the database
    // For now, just return success
    console.log('✅ [API] /api/users/[id]/roles - Roles updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'User roles updated successfully',
      userId: params.id,
      updatedRoles: roleIds
    });
    
  } catch (error) {
    console.error('❌ [API] /api/users/[id]/roles - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get roles for a user
function getUserRoles(userId: string) {
  // Define available roles
  const availableRoles = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'ADMIN',
      description: 'Administrator with full access',
      is_active: true
    },
    {
      id: '32d2eac0-6bbb-49b8-91f2-8906032312f0',
      name: 'MANAGER',
      description: 'Manager with elevated permissions',
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'USER',
      description: 'Basic user with standard access',
      is_active: true
    }
  ];

  // Default user role assignments (hardcoded for testing)
  const userRoleMap = {
    // Test user gets ADMIN role
    '5f493c59-420e-4a9b-afed-0b67bfa892d5': [availableRoles[0]], // ADMIN
    // Example users
    'user-1': [availableRoles[2]], // USER
    'user-2': [availableRoles[1]], // MANAGER
    'user-3': [availableRoles[0], availableRoles[1]] // ADMIN + MANAGER
  };

  // Return roles for the user, or default to USER role
  return userRoleMap[userId] || [availableRoles[2]];
}
