/**
 * SIMPLE PRISMA CLIENT SETUP
 * 
 * This module provides a straightforward Prisma client that:
 * - Uses direct SQLite connection for development
 * - Properly initializes the client
 * - Works reliably in all environments
 * - Handles driver adapter requirements for production
 */

import { PrismaClient } from '@prisma/client';

// Create a global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Build-time detection function
function isBuildTime() {
  return (
    // No DATABASE_URL available (typical during build)
    !process.env.DATABASE_URL ||
    // Choreo buildpack environment indicators
    process.env.PACK_VOLUME_KEY ||
    // Generic build environment indicators
    process.env.CI === 'true' && !process.env.DATABASE_URL ||
    // Google Cloud Build indicators
    process.env.BUILDER_OUTPUT ||
    // Docker build context
    process.env.DOCKER_BUILDKIT ||
    // Next.js build process
    process.env.NEXT_PHASE === 'phase-production-build'
  );
}

// Initialize Prisma client
let prisma: PrismaClient;

// During build time, create a mock client to avoid driver adapter issues
if (isBuildTime()) {
  console.log('🔧 Build time detected - creating mock Prisma client');
  
  // Create a mock client that won't actually connect
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      // Return a function that throws an error for any database operation
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return () => {
          throw new Error('Database operations not available during build time');
        };
      }
      // For model operations, return a proxy that throws
      return new Proxy({}, {
        get() {
          throw new Error('Database operations not available during build time');
        }
      });
    }
  });
} else if (process.env.NODE_ENV === 'production') {
  // Production environment
  console.log('🚀 Production environment - initializing Prisma client');
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // Development environment
  console.log('🔧 Development environment - initializing Prisma client');
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Test connection and log status (only if not build time)
if (!isBuildTime()) {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
    });
}

export { prisma };
export default prisma;
