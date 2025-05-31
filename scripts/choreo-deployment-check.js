#!/usr/bin/env node

/**
 * Choreo Deployment Configuration Check
 * Ensures PostgreSQL schema and configuration are correct for Choreo deployment
 */

const fs = require('fs');
const path = require('path');

console.log('[CHOREO CHECK] 🚀 Starting Choreo deployment verification...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Check if we're in Choreo environment
const isChoreoEnvironment = () => {
  return process.env.CHOREO_DEPLOYMENT === 'true' || 
         process.env.NODE_ENV === 'production' ||
         process.env.DATABASE_URL?.includes('postgres');
};

// Verify schema provider
const verifySchemaProvider = () => {
  if (!fs.existsSync(schemaPath)) {
    console.error('[CHOREO CHECK] ❌ schema.prisma not found');
    return false;
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const providerMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (!providerMatch) {
    console.error('[CHOREO CHECK] ❌ No database provider found in schema');
    return false;
  }

  const provider = providerMatch[1];
  console.log(`[CHOREO CHECK] 📋 Schema provider: ${provider}`);

  if (provider !== 'postgresql') {
    console.error('[CHOREO CHECK] ❌ CRITICAL: Schema provider must be PostgreSQL for Choreo');
    console.error('[CHOREO CHECK] 💡 Run: npm run schema:postgresql');
    return false;
  }

  // Check for Linux binary targets (required for Choreo containers)
  const binaryTargetsMatch = schemaContent.match(/binaryTargets\s*=\s*\[(.*?)\]/s);
  if (binaryTargetsMatch) {
    const targets = binaryTargetsMatch[1];
    const hasLinuxTarget = targets.includes('linux-musl') || targets.includes('debian-openssl');
    
    if (!hasLinuxTarget) {
      console.warn('[CHOREO CHECK] ⚠️ Missing Linux binary targets for container deployment');
    } else {
      console.log('[CHOREO CHECK] ✅ Linux binary targets configured');
    }
  }

  return true;
};

// Verify environment variables
const verifyEnvironment = () => {
  const errors = [];
  const warnings = [];

  console.log('[CHOREO CHECK] 🌍 Environment verification:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not-set'}`);
  console.log(`  CHOREO_DEPLOYMENT: ${process.env.CHOREO_DEPLOYMENT || 'not-set'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not-set'}`);

  // Check DATABASE_URL for production
  if (isChoreoEnvironment()) {
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL must be set for Choreo deployment');
    } else if (!process.env.DATABASE_URL.includes('postgres')) {
      errors.push('DATABASE_URL must be PostgreSQL for Choreo deployment');
    } else {
      console.log('[CHOREO CHECK] ✅ PostgreSQL DATABASE_URL configured');
    }

    if (process.env.NODE_ENV !== 'production') {
      warnings.push('NODE_ENV should be set to "production" for Choreo');
    }
  }

  return { errors, warnings };
};

// Check build artifacts
const checkBuildArtifacts = () => {
  const nextDir = path.join(process.cwd(), '.next');
  const standaloneDir = path.join(nextDir, 'standalone');

  if (!fs.existsSync(nextDir)) {
    console.log('[CHOREO CHECK] ℹ️ No build artifacts found (pre-build check)');
    return true;
  }

  if (!fs.existsSync(standaloneDir)) {
    console.warn('[CHOREO CHECK] ⚠️ Standalone build not found - ensure Next.js output is "standalone"');
    // Don't fail on this during pre-build phase, just warn
    if (process.argv.includes('--strict')) {
      return false;
    }
    return true;
  }

  console.log('[CHOREO CHECK] ✅ Build artifacts look good');
  return true;
};

// Main verification
try {
  console.log('[CHOREO CHECK] 🔍 Checking deployment readiness...');
  
  let allGood = true;

  // Schema verification
  if (!verifySchemaProvider()) {
    allGood = false;
  }

  // Environment verification
  const envCheck = verifyEnvironment();
  if (envCheck.errors.length > 0) {
    console.error('[CHOREO CHECK] ❌ Environment issues:');
    envCheck.errors.forEach(error => console.error(`  - ${error}`));
    allGood = false;
  }

  if (envCheck.warnings.length > 0) {
    console.warn('[CHOREO CHECK] ⚠️ Environment warnings:');
    envCheck.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Build artifacts check
  if (!checkBuildArtifacts()) {
    allGood = false;
  }

  if (allGood) {
    console.log('[CHOREO CHECK] ✅ All checks passed - ready for Choreo deployment!');
    console.log('[CHOREO CHECK] 🚀 PostgreSQL schema configured correctly');
    console.log('[CHOREO CHECK] 🎯 Environment variables validated');
  } else {
    console.error('[CHOREO CHECK] ❌ Deployment check failed');
    console.error('[CHOREO CHECK] 💡 Fix the issues above before deploying');
    process.exit(1);
  }

} catch (error) {
  console.error('[CHOREO CHECK] ❌ Verification error:', error.message);
  process.exit(1);
}

console.log('[CHOREO CHECK] ✅ Verification completed'); 