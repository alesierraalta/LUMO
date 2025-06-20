#!/usr/bin/env node

/**
 * Build Validation Script for Choreo Deployment
 */

const { spawn } = require('child_process');

console.log('🔍 Testing production build...');

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

buildProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ BUILD SUCCESS: Production build completed without errors');
    console.log('🚀 Ready for Choreo deployment');
  } else {
    console.error('\n❌ BUILD FAILED: Production build failed with exit code', code);
    console.error('🚨 Review build logs and fix issues before deployment');
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});
