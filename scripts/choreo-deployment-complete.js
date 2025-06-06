#!/usr/bin/env node

/**
 * Complete Choreo Deployment Configuration
 * Ensures all components are properly set up for Choreo deployment
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Complete Choreo Deployment Configuration...');

// Check if we're in production/Choreo environment
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.CHOREO_DEPLOYMENT === 'true';

if (!isProduction) {
  console.log('ℹ️ Not in production environment, skipping deployment configuration');
  process.exit(0);
}

console.log('🌍 Production environment detected');

async function runStep(name, scriptPath) {
  try {
    console.log(`\n📋 Step: ${name}`);
    console.log(`🔧 Running: ${scriptPath}`);
    
    execSync(`node ${scriptPath}`, { 
      stdio: 'inherit',
      env: { ...process.env },
      cwd: process.cwd()
    });
    
    console.log(`✅ ${name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Starting complete Choreo deployment configuration...\n');
  
  const steps = [
    {
      name: 'Schema Configuration',
      script: 'scripts/fix-choreo-schema.js',
      description: 'Convert schema from SQLite to PostgreSQL for production'
    },
    {
      name: 'Deployment Fix',
      script: 'scripts/choreo-deployment-fix.js',
      description: 'Configure Prisma client for direct PostgreSQL connection'
    },
    {
      name: 'Startup Configuration',
      script: 'scripts/choreo-startup-fix.js',
      description: 'Verify Excel importer functionality and health checks'
    },
    {
      name: 'Preflight Check',
      script: 'scripts/choreo-preflight.js',
      description: 'Final validation before server startup'
    },
    {
      name: 'Directory Setup',
      script: 'scripts/ensure-import-dirs.js',
      description: 'Ensure all required directories exist'
    }
  ];
  
  console.log('📊 Deployment Steps:');
  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.name}: ${step.description}`);
  });
  console.log('');
  
  let successCount = 0;
  
  for (const step of steps) {
    const success = await runStep(step.name, step.script);
    if (success) {
      successCount++;
    } else {
      console.error(`💥 Critical failure in step: ${step.name}`);
      console.error('🛑 Deployment configuration cannot continue');
      process.exit(1);
    }
  }
  
  console.log(`\n📊 Configuration Results: ${successCount}/${steps.length} steps completed`);
  
  if (successCount === steps.length) {
    console.log('🎉 Complete Choreo deployment configuration successful!');
    console.log('✅ All systems ready for production deployment');
    console.log('🚀 You can now start the server with: node .next/standalone/server.js');
    
    // Create deployment success marker
    const fs = require('fs');
    try {
      const markerPath = '/tmp/choreo-deployment-ready';
      fs.writeFileSync(markerPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'ready',
        steps: successCount,
        version: process.env.npm_package_version || 'unknown'
      }));
      console.log(`✅ Created deployment marker: ${markerPath}`);
    } catch (markerError) {
      console.warn('⚠️ Could not create deployment marker:', markerError.message);
    }
    
    process.exit(0);
  } else {
    console.error('💥 Deployment configuration failed');
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment configuration interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deployment configuration terminated');
  process.exit(1);
});

// Run with timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('⏰ Deployment configuration timed out after 5 minutes');
  process.exit(1);
}, 300000);

// Run the main function
main().catch((error) => {
  console.error('🚨 Unhandled error in deployment configuration:', error);
  process.exit(1);
}).finally(() => {
  clearTimeout(timeout);
}); 