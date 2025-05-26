/**
 * Configuración para Clerk según el entorno (desarrollo o producción)
 */

// Determinar si estamos en entorno de desarrollo
export function isDevEnvironment(): boolean {
  // Verificar si estamos en el navegador
  if (typeof window !== 'undefined') {
    // En el navegador, podemos verificar la URL o usar variables de entorno
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local');
  }
  
  // En el servidor, usamos la variable de entorno NODE_ENV
  return process.env.NODE_ENV !== 'production';
}

// Determinar si debemos omitir la autenticación
export function shouldSkipAuth(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
}

// Obtener la clave pública de Clerk según el entorno
export function getClerkPublishableKey(): string {
  // Si hay una clave explícita en las variables de entorno, la usamos
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  
  // De lo contrario, usamos las claves según el entorno
  return isDevEnvironment() 
    ? 'pk_test_Y2xlcmsuY2hvcmVvYXBwcy5kZXYk'  // Clave de desarrollo
    : 'pk_live_Y2xlcmsuY2hvcmVvYXBwcy5kZXYk'; // Clave de producción
}

// Obtener el dominio de Clerk
export function getClerkDomain(): string {
  return isDevEnvironment() 
    ? 'https://clerk.choreoapps.dev'
    : 'https://clerk.choreoapps.dev';
}

// Configuración para el proveedor de Clerk
export const clerkAppearance = {
  // Personalización del tema
  elements: {
    card: "shadow-md rounded-lg",
    formButtonPrimary: "bg-primary hover:bg-primary/90",
  },
  variables: {
    colorPrimary: "#3b82f6", // Blue-500
    colorBackground: "#ffffff", // White
    colorText: "#0f172a", // Slate-900
    fontFamily: "system-ui, -apple-system, sans-serif",
  }
}; 