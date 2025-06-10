import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest, isAdmin } from '@/lib/auth-simple';
import db from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER'], {
    errorMap: () => ({ message: 'Role must be ADMIN, MANAGER, or USER' })
  }),
});

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check authentication and admin privileges
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const currentUser = await getCurrentUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
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

    const { email, password, name, role } = result.data;

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true,
      },
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
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const currentUser = await getCurrentUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can view users' },
        { status: 403 }
      );
    }

    // Get all users with role data handled properly
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Format the response to ensure role is always a string
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: typeof user.role === 'object' ? user.role?.name || 'USER' : user.role || 'USER',
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