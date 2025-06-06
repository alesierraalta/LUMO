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
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || process.env.ACCELERATE_URL;
  
  if (!originalUrl && !accelerateUrl) {
    console.warn('⚠️ Neither DATABASE_URL nor PRISMA_ACCELERATE_URL set in environment variables');
    return undefined;
  }
  
  console.log('🔍 DATABASE_URL configuration check...');
  
  // Check for Prisma Accelerate first
  if (accelerateUrl) {
    console.log('✅ Prisma Accelerate URL found - using Accelerate configuration');
    console.log(`📋 Accelerate URL pattern: ${accelerateUrl.substring(0, 30)}...`);
    process.env.DATABASE_URL = accelerateUrl;
    return accelerateUrl;
  }
  
  if (originalUrl) {
    console.log(`📋 Original URL pattern: ${originalUrl.substring(0, 30)}...`);
    
    // Check if URL is Prisma Accelerate/Data Platform format
    if (originalUrl.startsWith('prisma://') || originalUrl.includes('accelerate.prisma-data.net')) {
      console.log('✅ DATABASE_URL uses Prisma Accelerate/Data Platform format');
      return originalUrl;
    }
    
    // In production/Choreo environment, be more careful about URL modification
    const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
    
    if (isProduction) {
      console.log('🏭 Production environment detected - checking for Prisma Accelerate requirement');
      
      // In production, if we have a PostgreSQL URL but the system expects Prisma Accelerate,
      // we should NOT convert the URL as it might be handled by the deployment environment
      if (originalUrl.startsWith('postgresql://') || originalUrl.startsWith('postgres://')) {
        console.log('⚠️ PostgreSQL URL in production - might need Prisma Accelerate configuration');
        console.log('💡 If you get P6001 errors, check if Choreo is configured for Prisma Accelerate');
        
        // Still fix the protocol, but warn about potential issues
        let fixedUrl = originalUrl;
        if (originalUrl.startsWith('postgres://')) {
          fixedUrl = originalUrl.replace('postgres://', 'postgresql://');
          console.log('🔧 Converted postgres:// to postgresql://');
          process.env.DATABASE_URL = fixedUrl;
        }
        
        return fixedUrl;
      }
    } else {
      // Development environment - apply standard fixes
      console.log('🔧 Development environment - applying standard URL fixes');
      
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
    }
    
    // For SQLite or other databases, return as-is
    console.log('ℹ️ Non-PostgreSQL database detected, keeping original URL');
    return originalUrl;
  }
  
  return undefined;
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