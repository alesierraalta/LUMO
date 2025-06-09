#!/usr/bin/env node
/**
 * Runtime Environment Check
 * 
 * This script validates that all required environment variables are set
 * before starting the application. This is crucial for Choreo deployment.
 */
console.log('🔍 Checking runtime environment...');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];
const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'NEXT_PUBLIC_APP_URL'
];
let hasErrors = false;
console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName}: Not set`);
    hasErrors = true;
  } else {
    // Show first 20 characters for security
    const displayValue = varName === 'DATABASE_URL' ? `${value.substring(0, 20)}...` :
                        varName === 'JWT_SECRET' ? '[Hidden]' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});
console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: Not set (using default)`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});
if (hasErrors) {
  console.error('\n❌ Missing required environment variables!');
  console.error('Make sure the following are set in your Choreo deployment:');
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`   - ${varName}`);
    }
  });
  process.exit(1);
}
console.log('\n✅ All required environment variables are set');
console.log('🚀 Ready to start application...');