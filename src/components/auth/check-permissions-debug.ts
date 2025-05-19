"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth";

export async function checkPermissionsWithDebug(requiredRole?: UserRole) {
  try {
    // Obtener el ID del usuario de Clerk
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return {
        authorized: false,
        debugInfo: {
          error: "No hay sesión de usuario",
          clerkUserId: null,
          userFound: false,
          role: null,
          requiredRole
        }
      };
    }
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true },
    });
    
    if (!user) {
      return {
        authorized: false,
        debugInfo: {
          error: "Usuario no encontrado en la base de datos",
          clerkUserId: userId,
          userFound: false,
          role: null,
          requiredRole
        }
      };
    }
    
    // Si no se requiere un rol específico, el usuario está autorizado
    if (!requiredRole) {
      return {
        authorized: true,
        debugInfo: {
          clerkUserId: userId,
          userFound: true,
          userEmail: user.email,
          role: user.role.name,
          requiredRole: "ninguno"
        }
      };
    }
    
    // Verificar si el usuario tiene el rol requerido
    const hasRequiredRole = user.role.name === requiredRole;
    
    return {
      authorized: hasRequiredRole,
      debugInfo: {
        clerkUserId: userId,
        userFound: true,
        userEmail: user.email,
        role: user.role.name,
        requiredRole,
        roleMatches: hasRequiredRole,
        isAdminEmail: user.email === "alesierraalta@gmail.com"
      }
    };
  } catch (error: any) {
    console.error("Error en la verificación de permisos:", error);
    return {
      authorized: false,
      debugInfo: {
        error: error.message || "Error desconocido en la verificación",
        requiredRole
      }
    };
  }
} 