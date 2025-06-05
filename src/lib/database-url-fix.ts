/**
 * Database URL Configuration Fix for Choreo Environment
 * Resolves the runtime DATABASE_URL protocol issue
 */

import 'server-only';

/**
 * Fix DATABASE_URL configuration for runtime
 */
export function fixDatabaseUrl(): string | undefined {
  const originalUrl = process.env.DATABASE_URL;
  
  if (!originalUrl) {
    console.warn('⚠️ DATABASE_URL not set in environment variables');
    return undefined;
  }
  
  console.log('🔍 DATABASE_URL configuration check...');
  console.log(`📋 Original URL pattern: ${originalUrl.substring(0, 30)}...`);
  
  // Check if URL is Prisma Accelerate/Data Platform format
  if (originalUrl.startsWith('prisma://') || originalUrl.includes('accelerate.prisma-data.net')) {
    console.log('✅ DATABASE_URL uses Prisma Accelerate/Data Platform format');
    return originalUrl;
  }
  
  // Check for PostgreSQL URL patterns that need conversion
  if (originalUrl.startsWith('postgresql://') || originalUrl.startsWith('postgres://')) {
    console.log('🔧 Converting PostgreSQL URL to standard format...');
    
    // For direct PostgreSQL connections, ensure proper protocol
    let fixedUrl = originalUrl;
    
    // Ensure postgresql:// (not postgres://)
    if (originalUrl.startsWith('postgres://')) {
      fixedUrl = originalUrl.replace('postgres://', 'postgresql://');
      console.log('🔧 Converted postgres:// to postgresql://');
    }
    
    // Set the fixed URL back to the environment
    process.env.DATABASE_URL = fixedUrl;
    console.log('✅ DATABASE_URL configuration fixed');
    console.log(`📋 Fixed URL pattern: ${fixedUrl.substring(0, 30)}...`);
    
    return fixedUrl;
  }
  
  // For SQLite or other databases, return as-is
  console.log('ℹ️ Non-PostgreSQL database detected, keeping original URL');
  return originalUrl;
}

/**
 * Initialize database URL fix on module load
 */
export function initializeDatabaseUrl() {
  try {
    console.log('🚀 Initializing database URL configuration...');
    const fixedUrl = fixDatabaseUrl();
    
    if (fixedUrl) {
      console.log('✅ Database URL initialized successfully');
      return true;
    } else {
      console.warn('⚠️ Database URL initialization failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing database URL:', error);
    return false;
  }
} 