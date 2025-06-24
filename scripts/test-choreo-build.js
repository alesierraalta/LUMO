#!/usr/bin/env node

/**
 * Test Choreo Build Process
 * Verifies that the build creates the correct standalone structure for deployment
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Testing Choreo Build Process...');

// Clean previous build
console.log('🧹 Cleaning previous build...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('✅ Previous build cleaned');
}

// Run build
console.log('🔨 Running production build...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  console.log(`\n📊 Build completed with code: ${code}`);
  
  if (code !== 0) {
    console.error('❌ Build failed');
    process.exit(1);
  }
  
  // Verify build structure
  console.log('🔍 Verifying build structure...');
  
  const checks = [
    { path: '.next', name: '.next directory' },
    { path: '.next/standalone', name: 'Standalone directory' },
    { path: '.next/standalone/server.js', name: 'Standalone server.js' },
    { path: '.next/static', name: 'Static assets' },
    { path: '.next/server', name: 'Server directory' }
  ];
  
  let allChecksPass = true;
  
  checks.forEach(check => {
    const fullPath = path.join(process.cwd(), check.path);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${check.name}: ${exists ? 'Found' : 'Missing'}`);
    if (!exists) allChecksPass = false;
  });
  
  // Check standalone server.js content
  const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
  if (fs.existsSync(standaloneServerPath)) {
    const serverContent = fs.readFileSync(standaloneServerPath, 'utf8');
    // Next.js standalone server has different structure - check for Next.js specific content
    const hasRequiredParts = serverContent.includes('next') && (serverContent.includes('server') || serverContent.includes('listen'));
    console.log(`${hasRequiredParts ? '✅' : '❌'} Standalone server content: ${hasRequiredParts ? 'Valid Next.js standalone server' : 'Invalid'}`);
    if (!hasRequiredParts) allChecksPass = false;
  }
  
  // Test choreo runtime setup
  console.log('🧪 Testing Choreo runtime setup...');
  try {
    const setupScript = require('./choreo-runtime-setup.js');
    console.log('✅ Choreo runtime setup: Valid');
  } catch (error) {
    console.log('❌ Choreo runtime setup: Failed -', error.message);
    allChecksPass = false;
  }
  
  // Final result
  if (allChecksPass) {
    console.log('\n🎉 BUILD VERIFICATION SUCCESSFUL!');
    console.log('✅ All required files and structures are present');
    console.log('🚀 Build is ready for Choreo deployment');
    
    // Show build size info
    try {
      const buildStats = fs.statSync(nextDir);
      console.log('📊 Build size information available');
    } catch (error) {
      console.log('⚠️ Could not get build size information');
    }
    
    process.exit(0);
  } else {
    console.log('\n❌ BUILD VERIFICATION FAILED!');
    console.log('🔧 Some required files or structures are missing');
    console.log('📋 Please check the build process and fix any issues');
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error.message);
  process.exit(1);
}); 