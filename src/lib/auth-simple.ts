import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';
const COOKIE_NAME = 'auth-token';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (payload: { userId: string; email: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DURATION}s` });
};

export const verifyToken = (token: string): SessionData | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionData;
  } catch (error) {
    return null;
  }
};

// User authentication
export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    // Find user with role relationship
    const user = await db.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      console.log(`[Auth] User not found for email: ${email}`);
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      console.log(`[Auth] Inactive account for email: ${email}`);
      return { success: false, error: 'Account is disabled' };
    }

    // Verify password (the 'password' field contains the hash)
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`[Auth] Invalid password for email: ${email}`);
      return { success: false, error: 'Invalid email or password' };
    }

    // Extract role name properly
    let roleName = 'USER';
    if (typeof user.role === 'string') {
      roleName = user.role;
    } else if (user.role && typeof user.role === 'object') {
      roleName = user.role.name || 'USER';
    }

    // Generate token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: roleName
    });

    console.log(`[Auth] Successful login for email: ${email}`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

// Get current user from token (client-compatible version)
export const getCurrentUserFromToken = async (token: string): Promise<User | null> => {
  try {
    if (!token) {
      return null;
    }

    // Verify token
    const sessionData = verifyToken(token);
    if (!sessionData) {
      return null;
    }

    // Find user by ID from token with role relationship
    const userWithRole = await db.user.findUnique({
      where: { id: sessionData.userId },
      include: { role: true },
    }) as any;

    if (!userWithRole || !userWithRole.isActive) {
      return null;
    }

    // Extract role name properly
    let roleName = 'USER';
    if (typeof userWithRole.role === 'string') {
      roleName = userWithRole.role;
    } else if (userWithRole.role && typeof userWithRole.role === 'object') {
      roleName = userWithRole.role.name || 'USER';
    }

    return {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      role: roleName,
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Set auth cookie
export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
  });
};

// Clear auth cookie
export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

// Get token from request
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // First, try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookie
  return request.cookies.get(COOKIE_NAME)?.value || null;
};

// Role-based access control
export const isAdmin = (user: User): boolean => {
  return user.role === 'ADMIN';
};

export const isManager = (user: User): boolean => {
  return user.role === 'MANAGER' || isAdmin(user);
};

export const hasRole = (user: User, role: string): boolean => {
  return user.role === role || isAdmin(user);
}; 