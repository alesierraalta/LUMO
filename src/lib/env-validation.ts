/**
 * Environment variable validation utilities for LUMO Inventory
 * Ensures that required environment variables are present and valid
 * Updated to use custom JWT authentication (no Clerk)
 */

// Check if we're running on the client side
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

// Check if we're in build time (Next.js build process)
function isBuildTime(): boolean {
  return (
    typeof window === 'undefined' && 
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build')
  );
}

// Get environment variable with fallback
function getEnvVar(key: string): string | undefined {
  // First try process.env
  let value = process.env[key];
  
  // On client side, also check embedded environment variables
  if (!value && isClientSide()) {
    // Check window.__NEXT_ENV__ (from our embedding script)
    value = (window as any).__NEXT_ENV__?.[key];
    
    // Check window.process.env (polyfill)
    if (!value && (window as any).process?.env) {
      value = (window as any).process.env[key];
    }
  }
  
  return value;
}

// Main environment validation function
export function validateEnvironment() {
  console.log('[ENV-VALIDATION] Starting environment validation...');
  
  // Skip validation during build time
  if (isBuildTime()) {
    console.log('[ENV-VALIDATION] Build-time detected, skipping validation');
    return;
  }
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !getEnvVar(varName));
  
  if (missingVars.length > 0) {
    console.error('[ENV-VALIDATION] ❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('[ENV-VALIDATION] ✅ All required environment variables are present');
}

// Get validated database URL
export function getValidatedDatabaseUrl(): string {
  const url = getEnvVar('DATABASE_URL');
  
  if (!url) {
    if (isBuildTime()) {
      return 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
    }
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    console.warn('[ENV-VALIDATION] ⚠️ DATABASE_URL should start with postgresql:// or postgres://');
  }
  
  return url;
}

// Get validated JWT secret
export function getValidatedJwtSecret(): string {
  if (isClientSide()) {
    throw new Error('JWT_SECRET is not available on the client side for security reasons.');
  }
  
  const secret = getEnvVar('JWT_SECRET');
  
  if (!secret) {
    if (isBuildTime()) {
      return 'build_time_placeholder_jwt_secret_minimum_32_chars';
    }
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }
  
  return secret;
}

// Environment validation for runtime
export function validateRuntimeEnvironment() {
  console.log('[ENV-VALIDATION] Validating runtime environment...');
  
  try {
    getValidatedDatabaseUrl();
    if (!isClientSide()) {
      getValidatedJwtSecret();
    }
    console.log('[ENV-VALIDATION] ✅ Runtime environment validation passed');
    return true;
  } catch (error) {
    console.error('[ENV-VALIDATION] ❌ Runtime environment validation failed:', error);
    return false;
  }
} 