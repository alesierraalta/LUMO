// Re-export all auth functions from our custom auth system
export * from '@/lib/auth';

import { prisma } from '@/lib/prisma';
import { getCurrentUser as getUser } from '@/lib/auth';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer' | 'user';

export interface UserData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: {
    id: string;
    name: UserRole;
  };
  permissions: string[];
}

/**
 * Get the current authenticated user with role and permissions
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  // Extract permissions from the role
  const permissions = user.role.permissions.map(
    (rp: any) => rp.permission.name
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: {
      id: user.role.id,
      name: user.role.name as UserRole,
    },
    permissions,
  };
}

/**
 * Check if the user has the specified role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role.name === role;
}

/**
 * Check if the user has the specified permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.permissions.includes(permission);
}

/**
 * Check if the user has at least one of the specified permissions
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && permissions.some(p => user.permissions.includes(p));
}

/**
 * Check if the user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && permissions.every(p => user.permissions.includes(p));
}

/**
 * Check if the user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Get user roles for select options
 */
export async function getUserRoles() {
  if (!prisma) {
    throw new Error('Database not available');
  }
  
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

// Compatibility aliases for easier migration
export { getCurrentUser as auth } from '@/lib/auth';
export { getCurrentUser as useAuth } from '@/lib/auth'; 