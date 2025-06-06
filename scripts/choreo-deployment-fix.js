#!/usr/bin/env node

/**
 * Choreo Deployment Prisma Accelerate Fix
 * Configures Prisma Accelerate for Choreo deployment environment
 */

console.log('🚀 Choreo Deployment Prisma Accelerate Fix...');

// Check if we're in Choreo environment
const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || 
                 process.env.NODE_ENV === 'production';

if (!isChoreo) {
  console.log('ℹ️ Not in Choreo environment, skipping deployment-specific fixes');
  process.exit(0);
}

console.log('🔧 Applying Choreo-specific Prisma Accelerate fixes...');

async function setupAccelerate() {
  try {
    // 1. Check for Prisma Accelerate configuration
    console.log('🔍 Checking for Prisma Accelerate configuration...');
    const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL;
    
    if (!accelerateUrl) {
      console.error('❌ No DATABASE_URL or PRISMA_ACCELERATE_URL found');
      console.log('💡 For Accelerate, set DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY');
      return false;
    }
    
    console.log(`🔗 Accelerate URL pattern: ${accelerateUrl.substring(0, 50)}...`);
    
    // 2. Validate Accelerate URL format
    if (accelerateUrl.startsWith('prisma://')) {
      console.log('✅ Prisma Accelerate URL detected');
      
      // Set the correct environment variables for Accelerate
      process.env.DATABASE_URL = accelerateUrl;
      
      // If we have a direct URL, use it for migrations
      if (directUrl) {
        process.env.DIRECT_URL = directUrl;
        console.log('✅ Direct URL configured for migrations');
      } else {
        console.warn('⚠️ No DIRECT_URL configured - migrations may not work');
        console.log('💡 Set DIRECT_URL to your direct PostgreSQL connection string');
      }
      
    } else if (accelerateUrl.startsWith('postgresql://') || accelerateUrl.startsWith('postgres://')) {
      console.log('ℹ️ Direct PostgreSQL URL detected - not using Accelerate');
      console.log('💡 To use Accelerate, update DATABASE_URL to prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY');
      
      // Fix postgres:// to postgresql:// if needed
      if (accelerateUrl.startsWith('postgres://')) {
        const fixedUrl = accelerateUrl.replace('postgres://', 'postgresql://');
        process.env.DATABASE_URL = fixedUrl;
        console.log('🔧 Fixed postgres:// to postgresql://');
      }
      
      // Add SSL mode if not present and in production
      if (!accelerateUrl.includes('sslmode=')) {
        const separator = accelerateUrl.includes('?') ? '&' : '?';
        process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}sslmode=require`;
        console.log('🔒 Added SSL mode for production');
      }
    } else {
      console.error('❌ Unrecognized DATABASE_URL format');
      console.log(`Current URL: ${accelerateUrl}`);
      return false;
    }
    
    // 3. Clear any existing Prisma client cache
    console.log('🧹 Clearing Prisma client cache...');
    try {
      const { execSync } = require('child_process');
      execSync('rm -rf node_modules/.prisma', { stdio: 'ignore' });
    } catch (error) {
      // Ignore cache clear errors
    }
    
    // 4. Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    const { execSync } = require('child_process');
    
    try {
      // Use appropriate generator based on URL type
      const isAccelerate = accelerateUrl.startsWith('prisma://');
      const generateCommand = isAccelerate ? 'npx prisma generate --no-engine' : 'npx prisma generate';
      
      execSync(generateCommand, { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✅ Prisma client regenerated successfully');
    } catch (error) {
      console.error('❌ Failed to regenerate Prisma client:', error.message);
      return false;
    }
    
    // 5. Test Prisma client creation (without connection)
    console.log('🧪 Testing Prisma client creation...');
    try {
      const { PrismaClient } = require('@prisma/client');
      
      if (accelerateUrl.startsWith('prisma://')) {
        const { withAccelerate } = require('@prisma/extension-accelerate');
        const client = new PrismaClient().$extends(withAccelerate());
        console.log('✅ Prisma client with Accelerate created successfully');
      } else {
        const client = new PrismaClient();
        console.log('✅ Prisma client (direct connection) created successfully');
      }
      
      // Don't test connection here - let the app handle it at runtime
      console.log('✅ Prisma configuration complete');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to create Prisma client:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Accelerate setup failed:', error);
    return false;
  }
}

// Run the setup
setupAccelerate().then(success => {
  if (success) {
    console.log('🎉 Choreo Prisma Accelerate setup completed successfully');
    process.exit(0);
  } else {
    console.error('💥 Choreo Prisma Accelerate setup failed');
    console.log('📚 Troubleshooting Guide:');
    console.log('1. Ensure DATABASE_URL is set to: prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY');
    console.log('2. Ensure DIRECT_URL is set to your direct PostgreSQL connection');
    console.log('3. Verify your Prisma Accelerate API key is valid');
    console.log('4. Check Choreo environment variables configuration');
    process.exit(0); // Continue deployment even if setup fails
  }
}).catch(error => {
  console.error('🚨 Unexpected error in Accelerate setup:', error);
  process.exit(0); // Continue deployment
}); 