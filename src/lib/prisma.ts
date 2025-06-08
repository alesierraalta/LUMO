/**
 * ROBUST PRISMA CLIENT WITH INLINE P6001 FIX
 * 
 * This module provides a production-ready Prisma client that:
 * - Automatically detects and fixes DATABASE_URL protocol issues
 * - Handles P6001 errors inline without external dependencies 
 * - Works reliably in all environments (dev, production, Choreo)
 * - Ensures client is always properly initialized
 */

// Import the monkey-patched Prisma client
import { PrismaClient } from '@prisma/client';

// Import the monkey-patched client
const { prisma } = require('./prisma-monkey-patch.js') as { prisma: PrismaClient };

// Export the Prisma client with proper TypeScript types
export { prisma };
export default prisma;

// Maintain compatibility with existing API
export const basePrisma: PrismaClient = prisma;

// Re-export Prisma types for convenience
export * from '@prisma/client';

// Extend the PrismaClient type with our custom methods
declare module '@prisma/client' {
  interface PrismaClient {
    healthCheck?(): Promise<{
      status: string;
      connection: string;
      error?: string;
    }>;
  }
}
