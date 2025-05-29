/**
 * Environment variable validation utilities
 * Ensures that required environment variables are present and valid
 */

// Clerk environment variables interface
interface ClerkEnvVars {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;
}

// Check if we're running on the client side
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

// Check if we're in build time (Next.js build process)
function isBuildTime(): boolean {
  // During build, these conditions are typically true
  return (
    typeof window === 'undefined' && 
    (
      process.env.NODE_ENV === 'production' && 
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.CLERK_SECRET_KEY
    ) ||
    // Additional build-time indicators
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build' ||
    // Check if we're in webpack compilation context
    (typeof (globalThis as any).__webpack_require__ !== 'undefined' && process.env.NODE_ENV === 'production')
  );
}

// Get environment variable with fallback to embedded config
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
    
    // If still no value, wait a bit and try again (script might still be loading)
    if (!value && key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
      console.log('[ENV-VALIDATION] Clerk key not found, checking all sources...');
      console.log('[ENV-VALIDATION] process.env keys:', Object.keys(process.env || {}));
      console.log('[ENV-VALIDATION] window.__NEXT_ENV__:', (window as any).__NEXT_ENV__);
      console.log('[ENV-VALIDATION] window.process?.env:', (window as any).process?.env);
    }
  }
  
  return value;
}

// Validate Clerk environment variables (server-side only for secret key)
export function validateClerkEnvVars(): ClerkEnvVars {
  // Handle build-time scenario gracefully
  if (isBuildTime()) {
    console.log('[ENV-VALIDATION] Build-time detected, using placeholder values');
    return {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_build_time_placeholder',
      CLERK_SECRET_KEY: 'sk_build_time_placeholder',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    };
  }

  const publishableKey = getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  const secretKey = getEnvVar('CLERK_SECRET_KEY');

  // Validate publishable key (required on both client and server)
  if (!publishableKey) {
    // Add debugging info for client-side
    if (isClientSide()) {
      console.error('[ENV-VALIDATION] Client-side environment check failed');
      console.error('[ENV-VALIDATION] process.env keys:', Object.keys(process.env || {}));
      console.error('[ENV-VALIDATION] window.__NEXT_ENV__:', (window as any).__NEXT_ENV__);
      console.error('[ENV-VALIDATION] window.process?.env:', (window as any).process?.env);
    }
    
    throw new Error(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required. ' +
      'Please set this variable in your .env.local file.'
    );
  }

  // Validate publishable key format
  if (!publishableKey.startsWith('pk_')) {
    throw new Error(
      `Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format: "${publishableKey}". ` +
      'Clerk publishable keys should start with "pk_".'
    );
  }

  // Validate minimum length
  if (publishableKey.length < 20) {
    throw new Error(
      `Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: key too short. ` +
      'Please verify you have the complete key from Clerk dashboard.'
    );
  }

  // On the client side, we can't validate the secret key as it's not available
  if (isClientSide()) {
    return {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
      CLERK_SECRET_KEY: 'client-side-placeholder', // Not available on client
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL') || '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL') || '/sign-up',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL') || '/dashboard',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL') || '/dashboard',
    };
  }

  // Server-side validation (validate secret key only on server)
  if (!secretKey) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is required. ' +
      'Please set this variable in your .env.local file.'
    );
  }

  // Validate secret key format (server-side only)
  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      `Invalid CLERK_SECRET_KEY format. ` +
      'Clerk secret keys should start with "sk_".'
    );
  }

  // Validate minimum length
  if (secretKey.length < 20) {
    throw new Error(
      `Invalid CLERK_SECRET_KEY: key too short. ` +
      'Please verify you have the complete key from Clerk dashboard.'
    );
  }

  return {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
    CLERK_SECRET_KEY: secretKey,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL') || '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL') || '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL') || '/dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL') || '/dashboard',
  };
}

// Get validated Clerk publishable key (safe for client and server)
export function getValidatedClerkPublishableKey(): string {
  try {
    const envVars = validateClerkEnvVars();
    return envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  } catch (error) {
    // During build time or when env vars are not available, return placeholder
    if (isBuildTime()) {
      return 'pk_build_time_placeholder';
    }
    throw error;
  }
}

// Get validated Clerk secret key (server-side only)
export function getValidatedClerkSecretKey(): string {
  if (isClientSide()) {
    throw new Error('CLERK_SECRET_KEY is not available on the client side for security reasons.');
  }
  
  try {
    const envVars = validateClerkEnvVars();
    return envVars.CLERK_SECRET_KEY;
  } catch (error) {
    // During build time, return placeholder
    if (isBuildTime()) {
      return 'sk_build_time_placeholder';
    }
    throw error;
  }
} 