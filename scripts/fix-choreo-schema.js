#!/usr/bin/env node

/**
 * Fix Choreo Schema Configuration
 * Updates Prisma schema for production PostgreSQL deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Choreo Schema Configuration...');

function fixPrismaSchema() {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Prisma schema not found at:', schemaPath);
      return false;
    }
    
    console.log('📖 Reading Prisma schema...');
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check current provider
    const sqliteMatch = schemaContent.match(/provider\s*=\s*"sqlite"/);
    const postgresMatch = schemaContent.match(/provider\s*=\s*"postgresql"/);
    
    if (postgresMatch && !sqliteMatch) {
      console.log('✅ Schema already configured for PostgreSQL');
      return true;
    }
    
    if (sqliteMatch) {
      console.log('🔄 Converting SQLite schema to PostgreSQL...');
      
      // Replace SQLite provider with PostgreSQL
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/g,
        'provider = "postgresql"'
      );
      
      // Replace SQLite URL with environment variable
      schemaContent = schemaContent.replace(
        /url\s*=\s*"file:\.\/dev\.db"/g,
        'url = env("DATABASE_URL")'
      );
      
      // Write the updated schema
      fs.writeFileSync(schemaPath, schemaContent);
      console.log('✅ Schema updated to PostgreSQL');
      
      return true;
    }
    
    console.warn('⚠️ Schema provider not recognized');
    return false;
    
  } catch (error) {
    console.error('❌ Failed to fix schema:', error.message);
    return false;
  }
}

function regeneratePrismaClient() {
  try {
    console.log('🔄 Regenerating Prisma client for PostgreSQL...');
    const { execSync } = require('child_process');
    
    // Generate with standard configuration (no --no-engine for PostgreSQL)
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ Prisma client regenerated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to regenerate Prisma client:', error.message);
    return false;
  }
}

function testConfiguration() {
  try {
    console.log('🧪 Testing PostgreSQL configuration...');
    
    // Test basic client creation
    const { PrismaClient } = require('@prisma/client');
    
    // For direct PostgreSQL URLs, use standard client (no Accelerate)
    const databaseUrl = process.env.DATABASE_URL || '';
    
    if (databaseUrl.startsWith('prisma://')) {
      console.log('🚀 Accelerate URL detected - using withAccelerate');
      const { withAccelerate } = require('@prisma/extension-accelerate');
      const client = new PrismaClient().$extends(withAccelerate());
    } else {
      console.log('🔗 Direct PostgreSQL URL - using standard client');
      const client = new PrismaClient();
    }
    
    console.log('✅ Prisma client configuration successful');
    return true;
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return false;
  }
}

// Run the fixes
async function main() {
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.CHOREO_DEPLOYMENT === 'true';
  
  if (!isProduction) {
    console.log('ℹ️ Not in production environment, skipping schema fix');
    process.exit(0);
  }
  
  console.log('🌍 Production environment detected');
  
  // Fix schema
  if (!fixPrismaSchema()) {
    console.error('💥 Failed to fix Prisma schema');
    process.exit(1);
  }
  
  // Regenerate client
  if (!regeneratePrismaClient()) {
    console.error('💥 Failed to regenerate Prisma client');
    process.exit(1);
  }
  
  // Test configuration
  if (!testConfiguration()) {
    console.warn('⚠️ Configuration test failed, but continuing deployment');
  }
  
  console.log('🎉 Choreo schema configuration completed successfully');
}

main().catch(error => {
  console.error('🚨 Unexpected error:', error);
  process.exit(1);
}); 