import { auth as serverAuth } from '@clerk/nextjs/server';
import { useAuth as useClientAuth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface UserData {
  id: string;
  clerkId: string;
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
 * Get the current Clerk user ID depending on client or server context
 */
export function getAuth() {
  // Server-side
  if (typeof window === 'undefined') {
    return serverAuth();
  }
  
  // Client-side (must be used in a component)
  throw new Error('getAuth() can only be used on the server. Use the useAuth() hook on the client.');
}

/**
 * Ensure user is synced with database
 */
async function ensureUserIsSynced(): Promise<void> {
  if (typeof window === 'undefined') return; // Only run on client-side
  
  try {
    // Call the sync-user API endpoint
    const response = await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to sync user');
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  }
}

/**
 * Get the current authenticated user with role and permissions
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const auth = getAuth();
  const userId = auth.userId;
  
  if (!userId) {
    return null;
  }

  // Ensure user is synced with database
  await ensureUserIsSynced();

  // Find user in our database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
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
    return null;
  }

  // Extract permissions from the role
  const permissions = user.role.permissions.map(
    (rp: any) => rp.permission.name
  );

  return {
    id: user.id,
    clerkId: user.clerkId,
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