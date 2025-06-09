#!/usr/bin/env node

/**
 * Ensure Prisma Client Configuration
 * 
 * This script ensures that the schema.prisma provider matches the DATABASE_URL
 * BEFORE the Prisma client is generated during the build process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Ensuring Prisma client configuration...');

// Detect environment
const dbUrl = process.env.DATABASE_URL;
const isBuildTime = !dbUrl || process.env.CI === 'true' || process.env.BUILDPACK === 'true';

if (isBuildTime) {
  console.log('🔨 Build time detected - ensuring PostgreSQL schema for production');
  
  // Force PostgreSQL configuration for build time
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schema.includes('provider = "postgresql"')) {
      console.log('🔧 Updating schema to PostgreSQL for production build...');
      schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, schema);
      console.log('✅ Schema updated to PostgreSQL');
    } else {
      console.log('✅ Schema already configured for PostgreSQL');
    }
  }
  
  // Generate Prisma client for production
  try {
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd() 
    });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Error generating Prisma client:', error.message);
    // Don't exit with error during build - let the build continue
    console.log('⚠️ Continuing with build...');
  }
} else {
  // Runtime - detect and configure based on actual DATABASE_URL
  console.log('🔄 Runtime detected - configuring based on DATABASE_URL');
  
  let expectedProvider = 'sqlite';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    expectedProvider = 'postgresql';
    console.log('✅ PostgreSQL detected from DATABASE_URL');
  } else if (dbUrl.startsWith('file:')) {
    expectedProvider = 'sqlite';
    console.log('✅ SQLite detected from DATABASE_URL');
  }
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schema.includes(`provider = "${expectedProvider}"`)) {
      console.log(`🔧 Updating schema to ${expectedProvider}...`);
      
      if (expectedProvider === 'postgresql') {
        schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      } else {
        schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
      }
      
      fs.writeFileSync(schemaPath, schema);
      console.log(`✅ Schema updated to ${expectedProvider}`);
      
      // Regenerate client for runtime
      try {
        console.log('🔄 Regenerating Prisma client for runtime...');
        execSync('npx prisma generate', { 
          stdio: 'inherit',
          cwd: process.cwd() 
        });
        console.log('✅ Prisma client regenerated');
      } catch (error) {
        console.error('❌ Error regenerating Prisma client:', error.message);
      }
    } else {
      console.log(`✅ Schema already configured for ${expectedProvider}`);
    }
  }
}

console.log('🎯 Prisma client configuration complete');
