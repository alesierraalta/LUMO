// LUMO Choreo Build Script - Ultra-efficient, error-resistant
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 [CHOREO-BUILD] Starting optimized build...');

// Build with Next.js
const buildProcess = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    NODE_OPTIONS: '--max-old-space-size=6144'
  }
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ [CHOREO-BUILD] Build successful!');
    
    // Verify standalone build
    const standalonePath = '.next/standalone';
    if (fs.existsSync(standalonePath)) {
      console.log('✅ [CHOREO-BUILD] Standalone build created');
    } else {
      console.log('⚠️ [CHOREO-BUILD] Standalone build not found (normal for some configs)');
    }
    
    process.exit(0);
  } else {
    console.error('❌ [CHOREO-BUILD] Build failed with code:', code);
    process.exit(1);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ [CHOREO-BUILD] Build error:', err.message);
  process.exit(1);
}); 