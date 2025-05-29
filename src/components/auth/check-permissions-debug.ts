"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth";

export async function checkPermissionsWithDebug(requiredRole?: UserRole) {
  try {
    // Check if we should skip Clerk authentication
    let skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
    
    // También verificar si tenemos claves inválidas (placeholder)
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (clerkKey && (
      clerkKey.includes('Y2xlcmsuY2hvcmVvYXBwcy5kZXYk') || // "clerk.choreoapps.dev$"
      clerkKey.includes('d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA') // placeholder
    )) {
      console.log('[PERMISSIONS] Invalid Clerk key detected, enabling skip auth mode');
      skipClerkAuth = true;
    }
    
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
        userMessage: "No se ha iniciado sesión. Por favor, inicia sesión para continuar.",
        debugInfo: {
          error: "No hay sesión de usuario",
          clerkUserId: null,
          userFound: false,
          role: null,
          requiredRole
        }
      };
    }
    
    // Buscar el usuario en la base de datos con manejo de errores mejorado
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { role: true },
      });
    } catch (dbError: any) {
      console.error("Error de base de datos:", dbError);
      
      // Manejo especial para errores de base de datos
      return {
        authorized: false,
        userMessage: "Hay un problema temporal con el sistema. Si eres administrador, contacta al soporte técnico.",
        debugInfo: {
          error: "Error de conexión a la base de datos",
          dbError: dbError.message,
          clerkUserId: userId,
          userFound: false,
          role: null,
          requiredRole
        }
      };
    }
    
    if (!user) {
      return {
        authorized: false,
        userMessage: "Tu cuenta no está configurada en el sistema. Contacta al administrador para obtener acceso.",
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
        userMessage: "Acceso autorizado",
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
    
    if (!hasRequiredRole) {
      return {
        authorized: false,
        userMessage: `No tienes permisos suficientes para acceder a esta sección. Se requiere rol: ${requiredRole}`,
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
    }
    
    return {
      authorized: hasRequiredRole,
      userMessage: "Acceso autorizado",
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
        userMessage: "Modo de desarrollo activo",
        debugInfo: {
          message: "Modo de desarrollo sin autenticación (error manejado)",
          error: error.message,
          skipClerkAuth: true
        }
      };
    }
    
    return {
      authorized: false,
      userMessage: "Ha ocurrido un error al verificar los permisos. Intenta nuevamente en unos momentos.",
      debugInfo: {
        error: error.message || "Error desconocido en la verificación",
        requiredRole
      }
    };
  }
} 