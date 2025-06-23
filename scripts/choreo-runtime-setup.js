#!/usr/bin/env node

/**
 * Choreo Runtime Setup Script
 * Prepares the LUMO application for production deployment in Choreo
 */

console.log('🚀 [Choreo Setup] Starting runtime configuration...');

// Environment validation
const requiredEnvs = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

console.log('🔍 [Choreo Setup] Validating environment variables...');
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error('❌ [Choreo Setup] Missing required environment variables:', missingEnvs);
  process.exit(1);
}

console.log('✅ [Choreo Setup] All required environment variables present');

// Set production optimizations
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Validate Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
  console.error('❌ [Choreo Setup] Invalid Supabase URL configuration');
  process.exit(1);
}

if (!supabaseKey || supabaseKey.length < 100) {
  console.error('❌ [Choreo Setup] Invalid Supabase anonymous key configuration');
  process.exit(1);
}

console.log('✅ [Choreo Setup] Supabase configuration validated');

// JWT Secret validation
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('❌ [Choreo Setup] JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

console.log('✅ [Choreo Setup] JWT configuration validated');

// Log deployment info
console.log('📊 [Choreo Setup] Deployment Information:');
console.log(`   - Node Version: ${process.version}`);
console.log(`   - Environment: ${process.env.NODE_ENV}`);
console.log(`   - Port: ${process.env.PORT || 3000}`);
console.log(`   - Hostname: ${process.env.HOSTNAME || '0.0.0.0'}`);
console.log(`   - Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

// Create health check endpoint validation
console.log('🏥 [Choreo Setup] Preparing health check system...');

console.log('🎉 [Choreo Setup] Runtime setup completed successfully!');
console.log('🚀 [Choreo Setup] Starting LUMO Inventory Management System...'); 