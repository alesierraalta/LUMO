// Simple permissions utility for checking user permissions
import { prisma } from "@/lib/prisma";

/**
 * Check if a user has a specific permission
 * @param userId The ID of the user to check permissions for
 * @param permissionKey The permission key to check (e.g., "inventory:manage")
 * @returns A boolean indicating if the user has the permission
 */
export async function checkPermission(userId: string, permissionKey: string): Promise<boolean> {
  try {
    // For now, we'll implement a simplified version that always returns true
    // In production, this should check against the user's role and permissions
    // in the database
    
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // If no user or no role, no permissions
    if (!user || !user.role) return false;

    // Admin has all permissions
    if (user.role.name === "admin") return true;

    // Check if the user's role has the permission
    return user.role.permissions.some(
      rp => `${rp.permission.resource}:${rp.permission.action}` === permissionKey
    );
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
} 