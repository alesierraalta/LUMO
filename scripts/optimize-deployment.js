#!/usr/bin/env node

/**
 * LUMO Deployment Optimization Script
 * Optimizes the application for production deployment on Choreo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting deployment optimization...');

// 1. Clean up unnecessary files
function cleanupFiles() {
  console.log('🧹 Cleaning up unnecessary files...');
  
  const filesToRemove = [
    'dev.db',
    'dev.db-journal',
    '.env.local',
    '.env.development',
    'node_modules/.cache',
    '.next/cache'
  ];
  
  filesToRemove.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
        console.log(`✅ Removed: ${file}`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to remove ${file}:`, error.message);
    }
  });
}

// 2. Optimize Prisma configuration
function optimizePrisma() {
  console.log('🔧 Optimizing Prisma configuration...');
  
  try {
    // Run schema fix to ensure proper configuration
    console.log('🔧 Running schema configuration...');
    execSync('node scripts/fix-prisma-schema.js --force-postgresql', { stdio: 'inherit' });
    
    // Generate client without engine for serverless deployment
    console.log('🔧 Generating Prisma client without engine...');
    execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
    
    console.log('✅ Prisma optimization complete');
  } catch (error) {
    console.error('❌ Prisma optimization failed:', error.message);
    throw error;
  }
}

// 3. Create deployment marker
function createDeploymentMarker() {
  console.log('📄 Creating deployment marker...');
  
  const marker = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    platform: 'choreo',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    optimizations: [
      'queryCompiler enabled',
      'no-engine deployment',
      'cleanup completed',
      'preflight optimized'
    ]
  };
  
  try {
    fs.writeFileSync('deployment-marker.json', JSON.stringify(marker, null, 2));
    console.log('✅ Deployment marker created');
  } catch (error) {
    console.log('⚠️ Failed to create deployment marker:', error.message);
  }
}

// 4. Verify critical directories
function verifyDirectories() {
  console.log('📁 Verifying critical directories...');
  
  const criticalDirs = [
    'prisma',
    'scripts',
    '.next/standalone',
    'logs'
  ];
  
  criticalDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  });
}

// 5. Main optimization function
async function optimize() {
  try {
    console.log('🚀 Starting LUMO deployment optimization...');
    
    cleanupFiles();
    verifyDirectories();
    optimizePrisma();
    createDeploymentMarker();
    
    console.log('\n✅ Deployment optimization completed successfully!');
    console.log('🚀 Application ready for Choreo deployment');
    
  } catch (error) {
    console.error('\n❌ Deployment optimization failed:', error.message);
    process.exit(1);
  }
}

// Run optimization if called directly
if (require.main === module) {
  optimize();
}

module.exports = { optimize }; 