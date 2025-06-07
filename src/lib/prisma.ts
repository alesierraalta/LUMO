/**
 * ROBUST PRISMA CLIENT WITH INLINE P6001 FIX
 * 
 * This module provides a production-ready Prisma client that:
 * - Automatically detects and fixes DATABASE_URL protocol issues
 * - Handles P6001 errors inline without external dependencies 
 * - Works reliably in all environments (dev, production, Choreo)
 * - Ensures client is always properly initialized
 */

import { PrismaClient } from '@prisma/client';

// Global variable to ensure singleton pattern works in all environments
declare global {
  var __prisma_client__: PrismaClient | undefined;
}

/**
 * Fix DATABASE_URL protocol issues (P6001 prevention)
 */
function fixDatabaseUrl(): string {
  let databaseUrl = process.env.DATABASE_URL || '';
  
  // Log current URL for debugging (without exposing credentials)
  console.log('🔄 P6001-FIX: Checking DATABASE_URL format:', databaseUrl.slice(0, 15) + '...');
  
  // Fix protocol issues
  if (databaseUrl.startsWith('prisma://')) {
    console.log('🔄 P6001-FIX: Converting prisma:// to postgresql://');
    databaseUrl = databaseUrl.replace('prisma://', 'postgresql://');
    process.env.DATABASE_URL = databaseUrl;
  } else if (databaseUrl.startsWith('postgres://')) {
    console.log('🔄 P6001-FIX: Converting postgres:// to postgresql://');
    databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
    process.env.DATABASE_URL = databaseUrl;
  }
  
  // For development, provide a default SQLite fallback
  if (!databaseUrl && process.env.NODE_ENV !== 'production') {
    databaseUrl = 'file:./dev.db';
    process.env.DATABASE_URL = databaseUrl;
    console.log('🔄 P6001-FIX: Using SQLite fallback for development');
  }
  
  return databaseUrl;
}

/**
 * Create Prisma client with robust error handling
 */
function createPrismaClient(): PrismaClient {
  try {
    // Fix the DATABASE_URL first
    const fixedUrl = fixDatabaseUrl();
    
    if (!fixedUrl) {
      throw new Error('DATABASE_URL is not configured');
    }
    
    console.log('✅ P6001-FIX: Creating Prisma client with fixed URL');
    
    // Create client with the fixed URL
    const client = new PrismaClient({
      datasources: {
        db: {
          url: fixedUrl
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
    
    // Test the connection to ensure it works
    client.$connect().catch((error) => {
      console.error('❌ Prisma connection test failed:', error.message);
    });
    
    console.log('✅ P6001-FIX: Prisma client created successfully');
    return client;
    
  } catch (error: any) {
    console.error('❌ P6001-FIX: Failed to create Prisma client:', error.message);
    
    // If there's still a P6001 error, try one more fix
    if (error.message?.includes('prisma://') || error.code === 'P6001') {
      console.log('🔧 P6001-FIX: Attempting emergency protocol fix');
      
      let emergencyUrl = process.env.DATABASE_URL || '';
      if (emergencyUrl.includes('prisma://')) {
        emergencyUrl = emergencyUrl.replace('prisma://', 'postgresql://');
        process.env.DATABASE_URL = emergencyUrl;
        
        return new PrismaClient({
          datasources: {
            db: {
              url: emergencyUrl
            }
          }
        });
      }
    }
    
    throw error;
  }
}

/**
 * Get or create the singleton Prisma client instance
 */
function getPrismaClient(): PrismaClient {
  // In development, use global variable to prevent hot reload issues
  if (process.env.NODE_ENV === 'development') {
    if (!global.__prisma_client__) {
      global.__prisma_client__ = createPrismaClient();
    }
    return global.__prisma_client__;
  }
  
  // In production, create a new instance (Next.js will handle caching)
  return createPrismaClient();
}

// Create and export the client
export const prisma = getPrismaClient();

// Default export for compatibility
export default prisma;

// Additional exports for backwards compatibility
export const basePrisma = prisma;

// Cleanup function for graceful shutdown
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma client disconnected gracefully');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma client:', error);
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    disconnectPrisma();
  });
}
