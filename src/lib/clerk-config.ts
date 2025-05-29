/**
 * Configuración para Clerk según el entorno (desarrollo o producción)
 */

import { validateClerkEnvVars, getValidatedClerkPublishableKey } from './env-validation';

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

// Obtener la clave pública de Clerk usando validación
export function getClerkPublishableKey(): string {
  return getValidatedClerkPublishableKey();
}

// Verificar si estamos usando claves de producción
export function isUsingProductionKeys(): boolean {
  try {
    const key = getClerkPublishableKey();
    return key.startsWith('pk_live_');
  } catch {
    return false;
  }
}

// Verificar si hay problemas potenciales con la configuración actual
export function checkClerkConfiguration(): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let isValid = true;

  try {
    const isProduction = isUsingProductionKeys();
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const isForced = typeof window !== 'undefined' && process.env.FORCE_PRODUCTION_ON_LOCALHOST === 'true';
    
    if (isProduction && isLocalhost && !isForced) {
      isValid = false;
      warnings.push('Using production Clerk keys (pk_live_) on localhost may cause loading errors');
      recommendations.push('Use development keys: npm run dev:clerk');
      recommendations.push('Use production test mode: npm run dev:prod-test');
      recommendations.push('Configure your Clerk app to allow localhost in production settings');
      recommendations.push('Use your production domain instead of localhost');
    } else if (isProduction && isLocalhost && isForced) {
      // Production test mode - show info but no warnings
      warnings.push('🧪 Production test mode: Using production keys on localhost (forced)');
    }

    if (!isProduction && !isLocalhost) {
      warnings.push('Using development keys on a production-like domain');
      recommendations.push('Consider using production keys for non-localhost environments');
    }

  } catch (error) {
    isValid = false;
    warnings.push('Failed to load Clerk configuration');
    recommendations.push('Check your environment variables');
  }

  return { isValid, warnings, recommendations };
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