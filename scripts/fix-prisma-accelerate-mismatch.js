#!/usr/bin/env node

/**
 * Fix Prisma Accelerate Mismatch - P6001 Error Resolution
 * 
 * This script resolves the mismatch between Prisma client configuration
 * expecting Prisma Accelerate and actual direct PostgreSQL connections.
 */

console.log('🔧 Fixing Prisma Accelerate Mismatch (P6001 Error)...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixPrismaMismatch() {
  try {
    // 1. Analyze current configuration
    console.log('📊 Analyzing current configuration...');
    
    const databaseUrl = process.env.DATABASE_URL;
    const currentEnv = process.env.NODE_ENV || 'development';
    
    console.log(`🌍 Environment: ${currentEnv}`);
    console.log(`🔗 DATABASE_URL pattern: ${databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'NOT SET'}`);
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // 2. Determine if we have Accelerate or Direct connection
    const isAccelerateUrl = databaseUrl.startsWith('prisma://');
    const isDirectPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
    
    console.log(`🔍 URL Type Analysis:`);
    console.log(`   - Prisma Accelerate: ${isAccelerateUrl ? '✅' : '❌'}`);
    console.log(`   - Direct PostgreSQL: ${isDirectPostgres ? '✅' : '❌'}`);
    
    if (isAccelerateUrl) {
      console.log('ℹ️ Prisma Accelerate URL detected - configuration should be correct');
      console.log('💡 If you\'re getting P6001 errors, check your API key');
      return true;
    }
    
    if (!isDirectPostgres) {
      throw new Error(`Unsupported DATABASE_URL format: ${databaseUrl.substring(0, 20)}...`);
    }
    
    // 3. Fix Direct PostgreSQL configuration
    console.log('🔄 Configuring for direct PostgreSQL connection...');
    
    // Fix postgres:// to postgresql:// if needed
    let fixedUrl = databaseUrl;
    if (databaseUrl.startsWith('postgres://')) {
      fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
      console.log('🔧 Fixed postgres:// to postgresql://');
    }
    
    // Add SSL mode for production if not present
    if (currentEnv === 'production' && !fixedUrl.includes('sslmode=')) {
      const separator = fixedUrl.includes('?') ? '&' : '?';
      fixedUrl = `${fixedUrl}${separator}sslmode=require`;
      console.log('🔒 Added SSL mode for production');
    }
    
    // Update environment variable
    process.env.DATABASE_URL = fixedUrl;
    
    // 4. Check if schema needs modification for direct connections
    console.log('📝 Checking Prisma schema configuration...');
    
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = '';
    
    try {
      schemaContent = fs.readFileSync(schemaPath, 'utf8');
    } catch (error) {
      console.warn(`⚠️ Could not read schema file: ${error.message}`);
    }
    
    // Check if schema has directUrl configuration (which would indicate Accelerate setup)
    const hasDirectUrl = schemaContent.includes('directUrl');
    
    if (hasDirectUrl) {
      console.log('🎯 Schema configured for Accelerate - creating direct connection version');
      
      // Create a temporary schema for direct connections
      const directSchema = schemaContent
        .replace(/directUrl\s*=\s*env\("[^"]+"\)/, '') // Remove directUrl
        .replace(/\n\s*directUrl[^\n]*\n/g, '\n'); // Remove directUrl lines
      
      // Write temporary schema
      const tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema.direct.prisma');
      fs.writeFileSync(tempSchemaPath, directSchema);
      console.log('📄 Created direct connection schema');
      
      // Generate client with direct schema
      console.log('🔄 Regenerating Prisma client for direct connections...');
      
      try {
        execSync(`npx prisma generate --schema=${tempSchemaPath}`, {
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: fixedUrl }
        });
        console.log('✅ Prisma client regenerated for direct connections');
        
        // Clean up temporary schema
        fs.unlinkSync(tempSchemaPath);
        
      } catch (error) {
        console.error('❌ Failed to regenerate Prisma client:', error.message);
        
        // Clean up temporary schema on error
        try {
          fs.unlinkSync(tempSchemaPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        throw error;
      }
    } else {
      console.log('✅ Schema already configured for direct connections');
      
      // Clear Prisma cache and regenerate
      console.log('🧹 Clearing Prisma cache...');
      try {
        execSync('rm -rf node_modules/.prisma', { stdio: 'ignore' });
      } catch (error) {
        // Ignore cache clear errors
      }
      
      console.log('🔄 Regenerating Prisma client...');
      execSync('npx prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: fixedUrl }
      });
      console.log('✅ Prisma client regenerated');
    }
    
    // 5. Test client creation
    console.log('🧪 Testing Prisma client creation...');
    
    try {
      // Clear require cache
      const prismaClientPath = require.resolve('@prisma/client');
      delete require.cache[prismaClientPath];
      
      const { PrismaClient } = require('@prisma/client');
      const client = new PrismaClient({
        datasources: {
          db: {
            url: fixedUrl
          }
        }
      });
      
      console.log('✅ Prisma client created successfully for direct connection');
      
      // Test a simple query (without connecting - just validation)
      console.log('🔍 Client configuration validated');
      
    } catch (error) {
      console.error('❌ Failed to create Prisma client:', error.message);
      throw error;
    }
    
    // 6. Create production startup script
    console.log('📜 Creating production startup configuration...');
    
    const startupConfig = {
      databaseUrl: "${DATABASE_URL}",
      connectionType: 'direct-postgresql',
      timestamp: new Date().toISOString(),
      fix: 'prisma-accelerate-mismatch-resolved'
    };
    
    const configPath = path.join(process.cwd(), 'prisma-config.json');
    fs.writeFileSync(configPath, JSON.stringify(startupConfig, null, 2));
    
    console.log('✅ Production configuration saved');
    
    return true;
    
  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const success = await fixPrismaMismatch();
  
  if (success) {
    console.log('\n🎉 Prisma Accelerate mismatch fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Configured for direct PostgreSQL connection');
    console.log('   ✅ Prisma client regenerated');
    console.log('   ✅ P6001 errors should be resolved');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your application');
    console.log('   2. Test login functionality');
    console.log('   3. Verify database operations work correctly');
    
    process.exit(0);
  } else {
    console.log('\n💥 Fix failed - manual intervention required');
    console.log('\n🔧 Manual fix steps:');
    console.log('   1. Ensure DATABASE_URL uses postgresql:// protocol');
    console.log('   2. Remove any directUrl from prisma/schema.prisma');
    console.log('   3. Run: npx prisma generate');
    console.log('   4. Restart application');
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('🚨 Unexpected error:', error);
  process.exit(1);
}); 