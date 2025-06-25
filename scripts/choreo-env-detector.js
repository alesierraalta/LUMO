#!/usr/bin/env node

/**
 * Choreo Environment Detector
 * Detects if running in Choreo dev or prod environment and configures accordingly
 */

console.log('🔍 [Choreo Env] Detecting environment...');

// Environment detection logic
function detectChoreoEnvironment() {
  // Check for Choreo-specific environment indicators
  const choreoEnv = process.env.CHOREO_ENV || 'unknown';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostname = process.env.HOSTNAME || '';
  
  // Choreo typically sets different hostnames for dev vs prod
  const isChoreoDev = hostname.includes('-dev-') || 
                     hostname.includes('dev.') || 
                     choreoEnv === 'development' ||
                     process.env.CHOREO_ENVIRONMENT === 'dev';
                     
  const isChoreoStaging = hostname.includes('-staging-') || 
                         hostname.includes('staging.') ||
                         choreoEnv === 'staging' ||
                         process.env.CHOREO_ENVIRONMENT === 'staging';
                         
  const isChoreoProd = hostname.includes('-prod-') || 
                      hostname.includes('prod.') ||
                      choreoEnv === 'production' ||
                      process.env.CHOREO_ENVIRONMENT === 'prod' ||
                      process.env.CHOREO_ENVIRONMENT === 'production';

  console.log('📊 [Choreo Env] Environment Analysis:');
  console.log(`   - HOSTNAME: ${hostname}`);
  console.log(`   - CHOREO_ENV: ${choreoEnv}`);
  console.log(`   - NODE_ENV: ${nodeEnv}`);
  console.log(`   - CHOREO_ENVIRONMENT: ${process.env.CHOREO_ENVIRONMENT || 'not set'}`);
  
  // Determine environment
  let detectedEnv = 'development';
  let shouldUseStandalone = false;
  
  if (isChoreoProd) {
    detectedEnv = 'production';
    shouldUseStandalone = true;
    console.log('🎯 [Choreo Env] PRODUCTION environment detected');
  } else if (isChoreoStaging) {
    detectedEnv = 'staging';
    shouldUseStandalone = true;
    console.log('🎭 [Choreo Env] STAGING environment detected');
  } else if (isChoreoDev) {
    detectedEnv = 'development';
    shouldUseStandalone = false;
    console.log('🧪 [Choreo Env] DEVELOPMENT environment detected');
  } else {
    // Default based on NODE_ENV
    detectedEnv = nodeEnv;
    shouldUseStandalone = nodeEnv === 'production';
    console.log(`🔧 [Choreo Env] Using NODE_ENV: ${nodeEnv}`);
  }
  
  return {
    environment: detectedEnv,
    useStandalone: shouldUseStandalone,
    isChoreo: true,
    isChoreoDev,
    isChoreoStaging, 
    isChoreoProd
  };
}

// Set environment variables based on detection
function configureEnvironment(envConfig) {
  console.log('⚙️ [Choreo Env] Configuring environment...');
  
  // Set NODE_ENV based on detected environment
  process.env.NODE_ENV = envConfig.environment;
  
  // Configure performance settings based on environment
  if (envConfig.environment === 'production' || envConfig.environment === 'staging') {
    // Production/Staging optimizations
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=4096';
    console.log('⚡ [Choreo Env] Production optimizations enabled');
  } else {
    // Development settings
    process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=2048';
    console.log('🧪 [Choreo Env] Development settings enabled');
  }
  
  // Set Choreo-specific flags
  process.env.CHOREO_DETECTED_ENV = envConfig.environment;
  process.env.CHOREO_USE_STANDALONE = envConfig.useStandalone.toString();
  
  console.log('✅ [Choreo Env] Environment configured:');
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - Use Standalone: ${envConfig.useStandalone}`);
  console.log(`   - Memory Limit: ${process.env.NODE_OPTIONS}`);
  
  return envConfig;
}

// Export configuration for use by other scripts
function getEnvironmentConfig() {
  const envConfig = detectChoreoEnvironment();
  return configureEnvironment(envConfig);
}

// If run directly, just detect and configure
if (require.main === module) {
  const config = getEnvironmentConfig();
  console.log('🎯 [Choreo Env] Configuration complete!');
  console.log('📋 [Choreo Env] Summary:', JSON.stringify(config, null, 2));
}

module.exports = { getEnvironmentConfig, detectChoreoEnvironment, configureEnvironment }; 