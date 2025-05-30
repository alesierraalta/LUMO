import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';
const COOKIE_NAME = 'auth-token';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      permission: {
        id: string;
        name: string;
        resource: string;
        action: string;
      };
    }>;
  };
  customPermissions?: Array<{
    permission: {
      id: string;
      name: string;
      resource: string;
      action: string;
    };
    granted: boolean;
  }>;
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

// Session management
export const createSession = async (
  userId: string,
  email: string,
  roleId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  const token = generateToken({ 
    userId, 
    email,
    roleId
  });
  
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
  
  await prisma.userSession.create({
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
  if (!prisma) return;
  
  await prisma.userSession.delete({
    where: { token },
  }).catch(() => {
    // Session might not exist, ignore error
  });
};

export const cleanupExpiredSessions = async (): Promise<void> => {
  if (!prisma) return;
  
  await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

// User authentication
export const authenticateUser = async (
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> => {
  try {
    if (!prisma) {
      return { success: false, error: 'Database not available' };
    }

    // Find user with role and permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is disabled' };
    }

    // Check for account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { success: false, error: 'Account is temporarily locked' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: lockUntil,
        },
      });
      
      return { success: false, error: 'Invalid email or password' };
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const token = await createSession(user.id, user.email, user.roleId, userAgent, ipAddress);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        roleId: user.roleId,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
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

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  roleId?: string
): Promise<AuthResult> => {
  try {
    if (!prisma) {
      return { success: false, error: 'Database not available' };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Get default role (user) if not specified
    let userRoleId = roleId;
    if (!userRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'user' },
      });
      
      if (!defaultRole) {
        // Create default role if it doesn't exist
        const newRole = await prisma.role.create({
          data: {
            name: 'user',
            description: 'Default user role',
          },
        });
        userRoleId = newRole.id;
      } else {
        userRoleId = defaultRole.id;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId: userRoleId!,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        roleId: user.roleId,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
};

// Get current user from session
export const getCurrentUser = async (token?: string): Promise<User | null> => {
  try {
    if (!prisma) return null;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Check if session exists and is valid
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await invalidateSession(token);
      }
      return null;
    }

    const user = session.user;

    if (!user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      roleId: user.roleId,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Logout user
export const logoutUser = async (token?: string): Promise<void> => {
  try {
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (token) {
      await invalidateSession(token);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Cookie utilities
export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
};

export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

// Request utilities
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Try cookie first
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

// Permission utilities
export const hasPermission = (user: User, resource: string, action: string): boolean => {
  // Check custom user permissions first (they override role permissions)
  if (user.customPermissions) {
    const customPermission = user.customPermissions.find(
      cp => cp.permission.resource === resource && cp.permission.action === action
    );
    if (customPermission) {
      return customPermission.granted;
    }
  }

  // Fallback to role permissions
  if (!user.role.permissions) return false;
  
  return user.role.permissions.some(
    (rp) => 
      rp.permission.resource === resource && 
      rp.permission.action === action
  );
};

export const hasPageAccess = (user: User, page: string): boolean => {
  return hasPermission(user, 'page', page);
};

export const isAdmin = (user: User): boolean => {
  return user?.role?.name === 'admin' || user?.role?.name === 'administrator';
};

// Constants
export { COOKIE_NAME, SESSION_DURATION }; 