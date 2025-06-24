#!/usr/bin/env node

/**
 * Test Docker Build for Choreo
 * Verifies that the Docker build creates the correct structure in /workspace
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🐳 Testing Docker Build for Choreo...');

// Check if Docker is available
console.log('🔍 Checking Docker availability...');
const dockerCheck = spawn('docker', ['--version'], { stdio: 'pipe' });

dockerCheck.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Docker is not available. Please install Docker to test the build.');
    process.exit(1);
  }
  
  console.log('✅ Docker is available');
  startDockerBuild();
});

dockerCheck.on('error', (error) => {
  console.error('❌ Docker is not available:', error.message);
  process.exit(1);
});

function startDockerBuild() {
  console.log('🔨 Building Docker image...');
  
  const buildProcess = spawn('docker', [
    'build',
    '-t', 'lumo-test',
    '--target', 'builder',
    '.'
  ], {
    stdio: 'inherit',
    shell: true
  });

  buildProcess.on('close', (code) => {
    console.log(`\n📊 Docker build completed with code: ${code}`);
    
    if (code !== 0) {
      console.error('❌ Docker build failed');
      process.exit(1);
    }
    
    console.log('✅ Docker build successful');
    
    // Test the build artifacts
    console.log('🔍 Testing build artifacts...');
    
    const inspectProcess = spawn('docker', [
      'run', '--rm', 'lumo-test',
      'sh', '-c', 'echo "=== WORKSPACE CONTENTS ===" && ls -la /workspace && echo "=== .NEXT CONTENTS ===" && ls -la /workspace/.next && echo "=== STANDALONE CHECK ===" && ls -la /workspace/.next/standalone || echo "No standalone found"'
    ], {
      stdio: 'inherit',
      shell: true
    });

    inspectProcess.on('close', (inspectCode) => {
      if (inspectCode === 0) {
        console.log('\n🎉 DOCKER BUILD TEST SUCCESSFUL!');
        console.log('✅ Build artifacts are correctly placed in /workspace');
        console.log('🚀 Ready for Choreo deployment');
      } else {
        console.log('\n❌ DOCKER BUILD TEST FAILED!');
        console.log('🔧 Build artifacts may not be in the correct location');
      }
      
      // Cleanup
      console.log('🧹 Cleaning up test image...');
      spawn('docker', ['rmi', 'lumo-test'], { stdio: 'ignore' });
    });

    inspectProcess.on('error', (error) => {
      console.error('❌ Failed to inspect Docker image:', error.message);
    });
  });

  buildProcess.on('error', (error) => {
    console.error('❌ Docker build process error:', error.message);
    process.exit(1);
  });
} 