import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isBuildTime, safeDbOperation } from './build-time-guards';


const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';
const COOKIE_NAME = 'auth-token';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
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
  roleId: string;
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
export const generateToken = (payload: { userId: string; email: string; roleId: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DURATION}s` });
};

export const verifyToken = (token: string): SessionData | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionData;
  } catch (error) {
    return null;
  }
};

// Access the Prisma client (now self-contained with P6001 protection)
const getPrismaClient = () => {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }
  
  // The new prisma client already has P6001 protection built-in
  return prisma;
};

// Session management
export const createSession = async (
  userId: string,
  email: string,
  role: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  const client = getPrismaClient();

  const token = generateToken({ 
    userId, 
    email,
    roleId: role // For backward compatibility with existing token structure
  });
  
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
  
  await client.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });
  
  return token;
};

export const invalidateSession = async (token: string): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.userSession.delete({
      where: { token },
    });
  } catch (error) {
    // Session might not exist, ignore error
  }
};

export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.warn('Failed to cleanup expired sessions:', error);
  }
};

// User authentication
export const authenticateUser = async (
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> => {
  try {
    const client = getPrismaClient();

    // Find user - no longer including role as a relation
    const user = await client.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`[Auth] User not found for email: ${email}`);
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      console.log(`[Auth] Inactive account for email: ${email}`);
      return { success: false, error: 'Account is disabled' };
    }

    // Check for account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log(`[Auth] Account locked for email: ${email}`);
      return { success: false, error: 'Account is temporarily locked' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.log(`[Auth] Invalid password for email: ${email}`);
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes
      
      await client.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: lockUntil,
        },
      });
      
      return { success: false, error: 'Invalid email or password' };
    }

    // Reset login attempts on successful login
    await client.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session - Now using role directly as it's a string
    const token = await createSession(user.id, user.email, user.role, userAgent, ipAddress);

    console.log(`[Auth] Successful login for email: ${email}`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as User,
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'An error occurred during authentication' };
  }
};

// User registration
export const registerUser = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  role?: string
): Promise<AuthResult> => {
  try {
    const client = getPrismaClient();

    // Check if user already exists
    const existingUser = await client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'User already exists with this email' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with default role "USER" if not specified
    const user = await client.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role: role || "USER",
      },
    });

    console.log(`[Auth] User registered successfully: ${email}`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as User,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An error occurred during registration' };
  }
};

// Get current user from token
export const getCurrentUser = async (token?: string): Promise<User | null> => {
  try {
    // During build time, return null to prevent database operations
    if (isBuildTime()) {
      console.warn('getCurrentUser called during build time, returning null');
      return null;
    }

    // Safe database operation wrapper
    return await safeDbOperation(async () => {
      const client = getPrismaClient();

      // Get token from parameter or cookies
      const cookieStore = await cookies();
      const authToken = token || cookieStore.get(COOKIE_NAME)?.value;

      if (!authToken) {
        return null;
      }

      // Verify token
      const sessionData = verifyToken(authToken);
      if (!sessionData) {
        return null;
      }

      // Check if session exists in database
      const session = await client.userSession.findUnique({
        where: { token: authToken },
        include: {
          user: true
        },
      });

      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await invalidateSession(authToken);
        }
        return null;
      }

      // Convert to our User interface
      const user = session.user;
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as User;
    }, null);
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Logout user
export const logoutUser = async (token?: string): Promise<void> => {
  try {
    const cookieStore = await cookies();
    const authToken = token || cookieStore.get(COOKIE_NAME)?.value;
    
    if (authToken) {
      await invalidateSession(authToken);
    }

    await clearAuthCookie();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Cookie management
export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_DURATION * 1000);
  
  cookieStore.set(COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

// Request helpers
export const getTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  return cookieToken || null;
};

// Permission helpers
export const hasPermission = (user: User, resource: string, action: string): boolean => {
  // Since role is now a string, we need to check based on role name
  // Admin role has all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // For other roles, we need a simplified permission model
  // This is a basic implementation - you may need to adjust based on your requirements
  if (user.role === 'manager' && resource === 'inventory') {
    return true;
  }
  
  // Default user permissions
  if (user.role === 'user') {
    // Allow basic read access
    if (action === 'read' && ['products', 'categories'].includes(resource)) {
      return true;
    }
  }
  
  return false;
};

export const hasPageAccess = (user: User, page: string): boolean => {
  // Admin can access all pages
  if (user.role === 'admin') {
    return true;
  }
  
  // Managers can access most pages
  if (user.role === 'manager') {
    return !['settings', 'users'].includes(page);
  }
  
  // Regular users have limited access
  if (user.role === 'user') {
    return ['dashboard', 'inventory', 'products'].includes(page);
  }
  
  return false;
};

export const isAdmin = (user: User): boolean => {
  return user.role === 'admin';
};

// Constants
export { COOKIE_NAME, SESSION_DURATION }; 
