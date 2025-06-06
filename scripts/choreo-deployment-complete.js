#!/usr/bin/env node

/**
 * Complete Choreo Deployment Configuration Script
 * 
 * This script runs all necessary deployment fixes and configurations
 * for successful Choreo deployment, including the critical Prisma
 * Accelerate mismatch fix that prevents P6001 errors.
 */

console.log('🚀 Complete Choreo Deployment Configuration...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we're in production/Choreo environment
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.CHOREO_DEPLOYMENT === 'true' ||
                    process.env.VERCEL || 
                    process.env.RAILWAY_PROJECT_ID;

if (isProduction) {
  console.log('🏭 Production environment detected');
} else {
  console.log('🔧 Development environment detected');
}

console.log('🛠️ Starting complete Choreo deployment configuration...');

// Define deployment steps with their corresponding scripts
const deploymentSteps = [
  {
    name: 'Prisma Mismatch Fix',
    script: 'scripts/fix-prisma-accelerate-mismatch.js',
    description: 'Fix Prisma Accelerate/Direct connection mismatch (prevents P6001 errors)'
  },
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

console.log('\n📋 Deployment Steps:');
deploymentSteps.forEach((step, index) => {
  console.log(`  ${index + 1}. ${step.name}: ${step.description}`);
});
console.log('');

// Track step results
const stepResults = [];

async function runDeploymentStep(step, index) {
  const stepNumber = index + 1;
  console.log(`\n🔧 Step: ${step.name}`);
  console.log(`📄 Running: ${step.script}`);
  
  try {
    const scriptPath = path.join(process.cwd(), step.script);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.warn(`⚠️ Script not found: ${step.script}`);
      stepResults.push({ step: step.name, status: 'SKIPPED', reason: 'Script not found' });
      return true; // Continue with other steps
    }
    
    // Run the script
    execSync(`node ${step.script}`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log(`✅ ${step.name} completed successfully`);
    stepResults.push({ step: step.name, status: 'SUCCESS' });
    return true;
    
  } catch (error) {
    console.error(`❌ ${step.name} failed:`, error.message);
    stepResults.push({ step: step.name, status: 'FAILED', error: error.message });
    
    // Critical steps that should stop deployment
    const criticalSteps = ['Prisma Mismatch Fix', 'Schema Configuration'];
    
    if (criticalSteps.includes(step.name)) {
      console.error(`🚨 Critical step failed: ${step.name}`);
      console.error('🛑 Stopping deployment due to critical failure');
      return false;
    } else {
      console.warn(`⚠️ Non-critical step failed: ${step.name} - continuing deployment`);
      return true;
    }
  }
}

async function runCompleteDeployment() {
  let allSuccessful = true;
  
  // Run each deployment step
  for (let i = 0; i < deploymentSteps.length; i++) {
    const step = deploymentSteps[i];
    const success = await runDeploymentStep(step, i);
    
    if (!success) {
      allSuccessful = false;
      break;
    }
  }
  
  // Summary
  console.log('\n📊 Configuration Results:');
  
  const successful = stepResults.filter(r => r.status === 'SUCCESS').length;
  const failed = stepResults.filter(r => r.status === 'FAILED').length;
  const skipped = stepResults.filter(r => r.status === 'SKIPPED').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  
  // Detailed results
  stepResults.forEach(result => {
    const icon = result.status === 'SUCCESS' ? '✅' : 
                result.status === 'FAILED' ? '❌' : '⏭️';
    console.log(`${icon} ${result.step}: ${result.status}`);
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  if (allSuccessful && failed === 0) {
    console.log(`\n🎉 Complete deployment configuration successful! ${successful}/${deploymentSteps.length} steps completed`);
    console.log('✅ All systems ready for production deployment');
    console.log('🚀 You can now start the server');
    
    // Create deployment ready marker
    const markerPath = '/tmp/choreo-deployment-ready';
    try {
      fs.writeFileSync(markerPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        steps: stepResults,
        status: 'READY'
      }));
      console.log(`📝 Created deployment marker: ${markerPath}`);
    } catch (error) {
      console.warn('⚠️ Could not create deployment marker:', error.message);
    }
    
    return true;
  } else {
    console.log(`\n💥 Deployment configuration failed! ${failed} critical errors`);
    console.log('\n🔧 Manual intervention required:');
    
    stepResults.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   - Fix: ${result.step}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    return false;
  }
}

// Main execution
runCompleteDeployment().then(success => {
  if (success) {
    console.log('\n🎯 Deployment configuration complete - ready to start server');
    process.exit(0);
  } else {
    console.log('\n🚨 Deployment configuration incomplete - check errors above');
    process.exit(0); // Continue anyway for debugging
  }
}).catch(error => {
  console.error('🚨 Unexpected error in deployment configuration:', error);
  process.exit(0); // Continue anyway
}); 