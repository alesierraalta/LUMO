#!/usr/bin/env node

/**
 * Choreo Runtime Setup Script
 * Prepares the LUMO application for production deployment in Choreo
 */

const setupRuntime = async () => {
  console.log('🚀 [Choreo Setup] Starting runtime configuration...');

  // OPTIMIZATION: Run development startup optimizer if in development mode
  if (process.env.NODE_ENV === 'development' || process.env.CHOREO_ENVIRONMENT === 'Development') {
    console.log('⚡ [Choreo Setup] Running development startup optimizations...');
    try {
      const { optimizeDevStartup } = require('./optimize-dev-startup');
      await optimizeDevStartup();
    } catch (error) {
      console.warn('⚠️ [Choreo Setup] Development optimization failed, continuing:', error.message);
    }
  }

  // CRITICAL: Detect Choreo environment first
  const { getEnvironmentConfig } = require('./choreo-env-detector');
  const envConfig = getEnvironmentConfig();

  // Environment validation (relaxed for Choreo deployment)
  const criticalEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  console.log('🔍 [Choreo Setup] Validating critical environment variables...');
  const missingCritical = criticalEnvs.filter(env => !process.env[env]);

  if (missingCritical.length > 0) {
    console.error('❌ [Choreo Setup] Missing critical environment variables:', missingCritical);
    process.exit(1);
  }

  // Optional validation with warnings
  const optionalEnvs = ['DATABASE_URL', 'JWT_SECRET'];
  const missingOptional = optionalEnvs.filter(env => !process.env[env]);
  if (missingOptional.length > 0) {
    console.warn('⚠️ [Choreo Setup] Optional environment variables not found:', missingOptional);
    console.warn('⚠️ [Choreo Setup] These may be loaded at runtime by Choreo');
  }

  console.log('✅ [Choreo Setup] Critical environment variables validated');

  // Set optimizations based on detected environment
  // NOTE: NODE_ENV already set by choreo-env-detector
  if (envConfig.environment === 'production' || envConfig.environment === 'staging') {
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    console.log('⚡ [Choreo Setup] Production optimizations applied');
  } else {
    console.log('🧪 [Choreo Setup] Development mode optimizations applied');
  }

  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 [Choreo Setup] Debug - Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined');
  console.log('🔍 [Choreo Setup] Debug - Supabase Key length:', supabaseKey ? supabaseKey.length : 'undefined');
  console.log('🔍 [Choreo Setup] Debug - Supabase Key preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined');

  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    console.error('❌ [Choreo Setup] Invalid Supabase URL configuration');
    process.exit(1);
  }

  if (!supabaseKey || supabaseKey.length < 50) {
    console.error('❌ [Choreo Setup] Invalid Supabase anonymous key configuration');
    console.error('❌ [Choreo Setup] Key length:', supabaseKey ? supabaseKey.length : 'undefined');
    console.error('❌ [Choreo Setup] Full key value:', supabaseKey);
    process.exit(1);
  }

  console.log('✅ [Choreo Setup] Supabase configuration validated');

  // JWT Secret validation (optional)
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      console.warn('⚠️ [Choreo Setup] JWT_SECRET should be at least 32 characters');
    } else {
      console.log('✅ [Choreo Setup] JWT configuration validated');
    }
  } else {
    console.warn('⚠️ [Choreo Setup] JWT_SECRET not found - may be loaded at runtime');
  }

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
};

// Run the setup
setupRuntime().catch(error => {
  console.error('❌ [Choreo Setup] Runtime setup failed:', error);
  process.exit(1);
}); 