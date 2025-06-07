/**
 * Build Time Guards - Utility to prevent database operations during Next.js build
 * 
 * This module provides utilities to detect build-time vs runtime execution
 * and prevent database connections during static site generation.
 */

/**
 * Detect if we're currently in a build-time environment
 */
export const isBuildTime = (): boolean => {
  // Multiple ways to detect build time
  return (
    // No environment variables available
    typeof process === 'undefined' ||
    // No DATABASE_URL (common in build environments)
    !process.env.DATABASE_URL ||
    // Webpack build context
    typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL ||
    // Next.js build phase
    process.env.NEXT_PHASE === 'phase-production-build' ||
    // Common CI/build indicators
    process.env.CI === 'true' && !process.env.DATABASE_URL
  );
};

/**
 * Detect if we're in a runtime environment where database operations are safe
 */
export const isRuntime = (): boolean => {
  return !isBuildTime() && typeof process !== 'undefined' && !!process.env.DATABASE_URL;
};

/**
 * Guard function for database operations - throws error if called during build
 */
export const guardDatabaseOperation = (operationName: string = 'Database operation'): void => {
  if (isBuildTime()) {
    throw new Error(`${operationName} attempted during build time. This operation should only run at runtime.`);
  }
};

/**
 * Safe wrapper for database operations that returns null during build time
 */
export const safeDbOperation = async <T>(
  operation: () => Promise<T>, 
  buildTimeDefault: T | null = null
): Promise<T | null> => {
  if (isBuildTime()) {
    console.warn('Database operation skipped during build time');
    return buildTimeDefault;
  }
  
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    return buildTimeDefault;
  }
};

/**
 * Environment information for debugging
 */
export const getEnvironmentInfo = () => {
  return {
    isBuildTime: isBuildTime(),
    isRuntime: isRuntime(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nextPhase: process.env.NEXT_PHASE,
    isCI: process.env.CI,
    platform: typeof window !== 'undefined' ? 'browser' : 'server'
  };
}; 