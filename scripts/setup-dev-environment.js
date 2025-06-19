#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Sets up Next.js 15.3.1 development environment with Supabase polyfill support
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up LUMO development environment...');

// Source and target paths
const configSource = path.join(__dirname, '..', 'config', 'development.env');
const envTarget = path.join(__dirname, '..', '.env.development.local');

try {
  // Check if polyfill exists
  const polyfillPath = path.join(__dirname, '..', 'src', 'lib', 'supabase-polyfill.js');
  if (!fs.existsSync(polyfillPath)) {
    console.error('❌ Supabase polyfill not found at:', polyfillPath);
    console.log('Please ensure src/lib/supabase-polyfill.js exists');
    process.exit(1);
  }
  console.log('✅ Supabase polyfill found');

  // Copy development environment configuration
  if (fs.existsSync(configSource)) {
    const envContent = fs.readFileSync(configSource, 'utf8');
    fs.writeFileSync(envTarget, envContent);
    console.log('✅ Development environment configured');
    console.log('📁 Created:', envTarget);
  } else {
    console.error('❌ Development config not found at:', configSource);
    process.exit(1);
  }

  // Verify Next.js configuration
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    if (nextConfig.includes('supabase-polyfill.js')) {
      console.log('✅ Next.js configuration includes polyfill');
    } else {
      console.warn('⚠️ Next.js configuration may not include polyfill');
    }
  }

  // Verify middleware configuration
  const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    if (middlewareContent.includes('supabase-polyfill.js')) {
      console.log('✅ Middleware includes polyfill import');
    } else {
      console.warn('⚠️ Middleware may not include polyfill import');
    }
  }

  // Create cache directories
  const cacheDir = path.join(__dirname, '..', '.next', 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log('✅ Created cache directory');
  }

  // Test polyfill loading
  try {
    require(polyfillPath);
    console.log('✅ Polyfill loads successfully');
  } catch (error) {
    console.warn('⚠️ Polyfill loading test failed:', error.message);
  }

  console.log('\n🎉 Development environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run dev:fixed');
  console.log('2. Monitor console for polyfill success message');
  console.log('3. Check for resolution of TypeError issues');
  console.log('\n🔧 Available commands:');
  console.log('- npm run dev:fixed    # Enhanced development server');
  console.log('- npm run dev:clean    # Clean cache and start dev server');
  console.log('- npm run debug:polyfill # Test polyfill loading');
  console.log('- npm run clean:cache  # Clear Next.js cache');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
} 