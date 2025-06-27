#!/usr/bin/env node

/**
 * LUMO Build Script - ULTRA BUILD-SAFE VERSION
 * Enhanced with comprehensive build environment setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting LUMO build...');

// ULTRA BUILD FIX: Set comprehensive build environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_PHASE = 'phase-production-build';
process.env.BUILD_ID = 'choreo-build-' + Date.now();

// CRITICAL: Set placeholder Supabase values during build to trigger build mode
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
  console.log('🔧 Set placeholder SUPABASE_URL for build safety');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-key';
  console.log('🔧 Set placeholder SUPABASE_ANON_KEY for build safety');
}

// Additional build-safe environment variables
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-key';
process.env.JWT_SECRET = 'placeholder-jwt-secret-for-build-only';

console.log('🔍 Build Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  NEXT_PHASE:', process.env.NEXT_PHASE);
console.log('  BUILD_ID:', process.env.BUILD_ID);
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('  SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

try {
  // Run Next.js build with enhanced environment
  console.log('📦 Starting Next.js build with ultra build-safe environment...');
  
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Force build mode detection
      FORCE_BUILD_MODE: 'true',
      // Disable problematic features during build
      DISABLE_REALTIME: 'true',
      DISABLE_SUPABASE_REALTIME: 'true',
      // Memory optimization
      NODE_OPTIONS: '--max-old-space-size=6144'
    }
  });
  
  console.log('✅ Build completed successfully!');
  
  // Verify build output
  const buildDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(buildDir)) {
    console.log('✅ Build directory created successfully');
    
    // Check for standalone output
    const standaloneDir = path.join(buildDir, 'standalone');
    if (fs.existsSync(standaloneDir)) {
      console.log('✅ Standalone build output created');
    }
    
    // Check for server.js
    const serverFile = path.join(standaloneDir, 'server.js');
    if (fs.existsSync(serverFile)) {
      console.log('✅ Server.js file created for standalone deployment');
    }
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Enhanced error reporting
  if (error.message.includes('Missing Supabase configuration')) {
    console.error('🔧 ULTRA BUILD FIX NEEDED: Supabase configuration error during build');
    console.error('   This indicates the ultra build fix is not working properly');
    console.error('   Check that all Supabase imports have build mode detection');
  }
  
  if (error.message.includes('self is not defined')) {
    console.error('🔧 REALTIME FIX NEEDED: Browser-only code running in Node.js');
    console.error('   This indicates realtime dependencies are not properly excluded');
  }
  
  process.exit(1);
}

console.log('🎉 LUMO build process completed successfully!'); 