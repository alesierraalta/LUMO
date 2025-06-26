#!/usr/bin/env node

/**
 * Choreo Runtime Setup Script - BUILD ONLY VERSION
 * Prepares the LUMO application for build testing WITHOUT Supabase validation
 */

console.log('🚀 [Choreo Setup] Starting BUILD-ONLY runtime configuration...');
console.log('⚠️ [Choreo Setup] SKIPPING Supabase validation for build testing');

// CRITICAL: Detect Choreo environment first
const { getEnvironmentConfig } = require('./choreo-env-detector');
const envConfig = getEnvironmentConfig();

// MINIMAL validation - only check if variables exist (don't validate content)
const criticalEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('🔍 [Choreo Setup] Checking environment variables existence...');
const missingCritical = criticalEnvs.filter(env => !process.env[env]);

if (missingCritical.length > 0) {
  console.warn('⚠️ [Choreo Setup] Missing environment variables (using defaults for build test):', missingCritical);
  // Set minimal defaults for build testing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://build-test.supabase.co';
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'build-test-key-for-docker-build-validation-only';
  }
}

console.log('✅ [Choreo Setup] Environment variables set for build testing');

// Set optimizations based on detected environment
if (envConfig.environment === 'production' || envConfig.environment === 'staging') {
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  console.log('⚡ [Choreo Setup] Production optimizations applied');
} else {
  console.log('🧪 [Choreo Setup] Development mode optimizations applied');
}

// SKIP Supabase validation for build testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 [Choreo Setup] Debug - Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined');
console.log('🔍 [Choreo Setup] Debug - Supabase Key length:', supabaseKey ? supabaseKey.length : 'undefined');
console.log('🔍 [Choreo Setup] Debug - Supabase Key preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined');

console.log('⚠️ [Choreo Setup] SKIPPING Supabase URL validation (build-only mode)');
console.log('⚠️ [Choreo Setup] SKIPPING Supabase key validation (build-only mode)');
console.log('✅ [Choreo Setup] Build-only mode: Supabase validation bypassed');

// JWT Secret validation (optional, non-blocking)
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    console.warn('⚠️ [Choreo Setup] JWT_SECRET should be at least 32 characters (non-blocking for build test)');
  } else {
    console.log('✅ [Choreo Setup] JWT configuration validated');
  }
} else {
  console.warn('⚠️ [Choreo Setup] JWT_SECRET not found - using default for build test');
  process.env.JWT_SECRET = 'build-test-jwt-secret-32-characters-minimum-length';
}

// Log deployment info
console.log('📊 [Choreo Setup] Build Test Information:');
console.log(`   - Node Version: ${process.version}`);
console.log(`   - Environment: ${process.env.NODE_ENV}`);
console.log(`   - Port: ${process.env.PORT || 3000}`);
console.log(`   - Hostname: ${process.env.HOSTNAME || '0.0.0.0'}`);
console.log(`   - Build Mode: BUILD-ONLY (no real credentials required)`);

console.log('🎉 [Choreo Setup] BUILD-ONLY runtime setup completed successfully!');
console.log('🚀 [Choreo Setup] Ready for Docker build testing...'); 