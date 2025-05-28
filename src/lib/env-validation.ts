/**
 * Environment variable validation utilities
 * Ensures that required environment variables are present and valid
 */

// Clerk environment variables interface
interface ClerkEnvVars {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_SKIP_CLERK_AUTH?: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;
}

// Check if we're running on the client side
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

// Validate Clerk environment variables (server-side only for secret key)
export function validateClerkEnvVars(): ClerkEnvVars {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  // Check if auth is disabled
  if (process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true') {
    // When auth is disabled, we still need placeholder values for TypeScript
    return {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'auth-disabled',
      CLERK_SECRET_KEY: 'auth-disabled',
      NEXT_PUBLIC_SKIP_CLERK_AUTH: 'true',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    };
  }

  // Validate publishable key (required on both client and server)
  if (!publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required. ' +
      'Please set this variable in your .env.local file or set NEXT_PUBLIC_SKIP_CLERK_AUTH=true to disable authentication.'
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
      NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
    };
  }

  // Server-side validation (validate secret key only on server)
  if (!secretKey) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is required. ' +
      'Please set this variable in your .env.local file or set NEXT_PUBLIC_SKIP_CLERK_AUTH=true to disable authentication.'
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
    NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  };
}

// Get validated Clerk publishable key (safe for client and server)
export function getValidatedClerkPublishableKey(): string {
  const envVars = validateClerkEnvVars();
  return envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

// Get validated Clerk secret key (server-side only)
export function getValidatedClerkSecretKey(): string {
  if (isClientSide()) {
    throw new Error('CLERK_SECRET_KEY is not available on the client side for security reasons.');
  }
  
  const envVars = validateClerkEnvVars();
  return envVars.CLERK_SECRET_KEY;
}

// Check if authentication is enabled
export function isAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'true';
} 