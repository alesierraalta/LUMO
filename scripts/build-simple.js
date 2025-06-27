// LUMO Simple Build - Ultra-reliable for Choreo
console.log('🚀 Starting LUMO build...');

const { execSync } = require('child_process');

try {
  // Simple Next.js build
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production' 
    }
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 