import { NextResponse } from 'next/server';

/**
 * Endpoint para depuración de variables de entorno
 * IMPORTANTE: Solo usar en desarrollo, eliminar en producción
 */
export async function GET() {
  const envVars = {
    // Variables de autenticación (mostrando solo prefijos por seguridad)
    clerk_auth_enabled: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'true',
    clerk_publishable_key_set: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerk_secret_key_set: !!process.env.CLERK_SECRET_KEY,
    // Mostrar solo el inicio de la clave para verificar sin comprometer seguridad
    clerk_publishable_key_prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 
      ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 12)}...` 
      : 'no_key',
    clerk_publishable_key_full: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerk_sign_in_url: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    clerk_sign_up_url: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    
    // Información de entorno
    environment: process.env.NODE_ENV,
    skip_clerk_auth_value: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'not_set',
    
    // Información de configuración
    config_values: {
      from_env_local: true,
      from_env: true,
      from_next_config: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_dummy-key-for-build'
    }
  };

  return NextResponse.json(envVars);
} 