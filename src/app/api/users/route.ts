import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest, isAdmin } from '@/lib/auth-simple';
import { supabaseServer } from '@/lib/supabase-server-only';
import db from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Helper function to get current user from either Supabase or legacy JWT
async function getCurrentUser(request: NextRequest) {
  // Try Supabase authentication first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Initialize Supabase client
              const supabase = supabaseServer;
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        // Get user data from our database
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          include: { role: true }
        });
        
        if (dbUser && dbUser.isActive) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role?.name || 'USER',
            isActive: dbUser.isActive,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
        }
      }
    } catch (supabaseError) {
      console.log('Supabase auth failed, trying legacy JWT...');
    }
  }
  
  // Fallback to legacy JWT authentication
  const token = getTokenFromRequest(request);
  if (token) {
    return await getCurrentUserFromToken(token);
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check authentication and admin privileges
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, roleId } = result.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Verify role exists and is active
    const role = await db.role.findFirst({
      where: { 
        id: roleId,
        isActive: true 
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId,
        isActive: true,
      },
      include: {
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'User created successfully.',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check authentication and admin privileges
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can view users' },
        { status: 403 }
      );
    }

    // Get all users with their role data
    const users = await db.user.findMany({
      include: {
        role: true  // Include role data
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format the response to include complete role information
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        isSystem: user.role.isSystem,
        isActive: user.role.isActive
      } : null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 