"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth";

export async function checkPermissionsWithDebug(requiredRole?: UserRole) {
  try {
    // Check if we should skip Clerk authentication
    const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
    
    // Si estamos en modo de desarrollo sin autenticación, permitir todo
    if (skipClerkAuth) {
      return {
        authorized: true,
        debugInfo: {
          message: "Modo de desarrollo sin autenticación",
          skipClerkAuth: true,
          role: "admin",
          requiredRole
        }
      };
    }
    
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
    
    // Si hay un error y estamos en modo de desarrollo, permitir acceso
    if (process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true') {
      return {
        authorized: true,
        debugInfo: {
          message: "Modo de desarrollo sin autenticación (error manejado)",
          error: error.message,
          skipClerkAuth: true
        }
      };
    }
    
    return {
      authorized: false,
      debugInfo: {
        error: error.message || "Error desconocido en la verificación",
        requiredRole
      }
    };
  }
} 