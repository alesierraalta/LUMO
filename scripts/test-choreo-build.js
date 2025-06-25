#!/usr/bin/env node

/**
 * Choreo Build Testing Script
 * Tests Docker builds locally before deploying to Choreo
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 [Build Test] Starting Choreo build testing...');

// Configuration
const CONFIG = {
  imageName: 'lumo-choreo-test',
  containerName: 'lumo-test-container',
  testPort: 8080,
  healthEndpoint: '/api/health',
  maxWaitTime: 120000, // 2 minutes
  environments: {
    dev: {
      CHOREO_ENVIRONMENT: 'dev',
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://ndprriqyhddjoixrlqnz.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dev_key_placeholder'
    },
    prod: {
      CHOREO_ENVIRONMENT: 'prod', 
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://ubjujxtvlubxowsphvuk.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'prod_key_placeholder'
    }
  }
};

// Utility functions
function runCommand(command, options = {}) {
  console.log(`🔧 [Build Test] Running: ${command}`);
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    console.error(`❌ [Build Test] Command failed: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

function cleanup() {
  console.log('🧹 [Build Test] Cleaning up...');
  
  // Stop and remove container
  runCommand(`docker stop ${CONFIG.containerName}`, { silent: true });
  runCommand(`docker rm ${CONFIG.containerName}`, { silent: true });
  
  // Remove test image
  runCommand(`docker rmi ${CONFIG.imageName}`, { silent: true });
  
  console.log('✅ [Build Test] Cleanup completed');
}

function waitForHealthCheck(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkHealth = () => {
      const { spawn } = require('child_process');
      const curl = spawn('curl', ['-f', `http://localhost:${port}${CONFIG.healthEndpoint}`], {
        stdio: 'pipe'
      });
      
      curl.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Health check timeout'));
        } else {
          setTimeout(checkHealth, 2000);
        }
      });
      
      curl.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Health check timeout'));
        } else {
          setTimeout(checkHealth, 2000);
        }
      });
    };
    
    checkHealth();
  });
}

async function testBuild() {
  console.log('🏗️ [Build Test] Step 1: Building Docker image...');
  
  const buildResult = runCommand(`docker build --no-cache -t ${CONFIG.imageName} .`);
  if (!buildResult.success) {
    throw new Error('Docker build failed');
  }
  
  console.log('✅ [Build Test] Docker build completed successfully');
  return true;
}

async function testBuildArtifacts() {
  console.log('🔍 [Build Test] Step 2: Verifying build artifacts...');
  
  // Check if BUILD_ID exists in the built image
  const inspectResult = runCommand(
    `docker run --rm ${CONFIG.imageName} ls -la .next/BUILD_ID`,
    { silent: true }
  );
  
  if (!inspectResult.success) {
    throw new Error('BUILD_ID not found in built image');
  }
  
  // Check if standalone server exists
  const serverResult = runCommand(
    `docker run --rm ${CONFIG.imageName} ls -la server.js`,
    { silent: true }
  );
  
  if (!serverResult.success) {
    throw new Error('Standalone server.js not found in built image');
  }
  
  console.log('✅ [Build Test] Build artifacts verified');
  return true;
}

async function testEnvironment(envName, envVars) {
  console.log(`🌍 [Build Test] Step 3: Testing ${envName.toUpperCase()} environment...`);
  
  // Prepare environment variables
  const envFlags = Object.entries(envVars)
    .map(([key, value]) => `-e ${key}="${value}"`)
    .join(' ');
  
  // Start container
  const runResult = runCommand(
    `docker run -d --name ${CONFIG.containerName}-${envName} -p ${CONFIG.testPort}:8080 ${envFlags} ${CONFIG.imageName}`,
    { silent: true }
  );
  
  if (!runResult.success) {
    throw new Error(`Failed to start ${envName} container`);
  }
  
  console.log(`⏳ [Build Test] Waiting for ${envName} container to be ready...`);
  
  try {
    await waitForHealthCheck(CONFIG.testPort, 90000);
    console.log(`✅ [Build Test] ${envName.toUpperCase()} environment test passed`);
    
    // Get container logs for analysis
    const logsResult = runCommand(
      `docker logs ${CONFIG.containerName}-${envName}`,
      { silent: true }
    );
    
    if (logsResult.success) {
      console.log(`📋 [Build Test] ${envName.toUpperCase()} container logs:`);
      console.log(logsResult.output.split('\n').slice(-10).join('\n')); // Last 10 lines
    }
    
    return true;
  } catch (error) {
    // Get logs for debugging
    const logsResult = runCommand(
      `docker logs ${CONFIG.containerName}-${envName}`,
      { silent: true }
    );
    
    if (logsResult.success) {
      console.log(`📋 [Build Test] ${envName.toUpperCase()} container logs (for debugging):`);
      console.log(logsResult.output);
    }
    
    throw new Error(`${envName} environment test failed: ${error.message}`);
  } finally {
    // Cleanup this specific container
    runCommand(`docker stop ${CONFIG.containerName}-${envName}`, { silent: true });
    runCommand(`docker rm ${CONFIG.containerName}-${envName}`, { silent: true });
  }
}

async function runTests() {
  let success = true;
  const results = [];
  
  try {
    // Test 1: Build
    await testBuild();
    results.push({ test: 'Docker Build', status: 'PASSED' });
    
    // Test 2: Build Artifacts
    await testBuildArtifacts();
    results.push({ test: 'Build Artifacts', status: 'PASSED' });
    
    // Test 3: Production Environment
    await testEnvironment('prod', CONFIG.environments.prod);
    results.push({ test: 'Production Environment', status: 'PASSED' });
    
    // Test 4: Development Environment
    await testEnvironment('dev', CONFIG.environments.dev);
    results.push({ test: 'Development Environment', status: 'PASSED' });
    
  } catch (error) {
    console.error(`❌ [Build Test] Test failed: ${error.message}`);
    results.push({ test: 'Current Test', status: 'FAILED', error: error.message });
    success = false;
  } finally {
    cleanup();
  }
  
  // Summary
  console.log('\n📊 [Build Test] Test Results Summary:');
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`   ${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  if (success) {
    console.log('\n🎉 [Build Test] ALL TESTS PASSED!');
    console.log('✅ [Build Test] Your build is ready for Choreo deployment');
    console.log('🚀 [Build Test] You can safely push to your repository and deploy');
  } else {
    console.log('\n🚨 [Build Test] SOME TESTS FAILED!');
    console.log('❌ [Build Test] Please fix the issues before deploying to Choreo');
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 [Build Test] Interrupted, cleaning up...');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 [Build Test] Terminated, cleaning up...');
  cleanup();
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('💥 [Build Test] Unexpected error:', error);
  cleanup();
  process.exit(1);
});

module.exports = { runTests, CONFIG }; 