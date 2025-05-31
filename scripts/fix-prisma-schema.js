#!/usr/bin/env node

/**
 * LUMO Inventory System - Dynamic Schema Selection
 * Automatically selects the correct Prisma schema based on environment
 */

const fs = require('fs');
const path = require('path');

console.log('[SCHEMA SELECTOR] 🚀 Starting dynamic schema selection...');

// IMPROVED ENVIRONMENT DETECTION FOR CHOREO
function detectEnvironment() {
  console.log('[SCHEMA SELECTOR] 🔍 Environment Detection:');
  
  const nodeEnv = process.env.NODE_ENV;
  const choreoDeployment = process.env.CHOREO_DEPLOYMENT;
  const databaseUrl = process.env.DATABASE_URL;
  const workingDir = process.cwd();
  
  console.log(`  NODE_ENV: ${nodeEnv || 'not-set'}`);
  console.log(`  CHOREO_DEPLOYMENT: ${choreoDeployment || 'not-set'}`);
  console.log(`  DATABASE_URL: ${databaseUrl ? 'set' : 'not-set'}`);
  console.log(`  Working Directory: ${workingDir}`);
  
  // 🎯 CHOREO DETECTION STRATEGY:
  // 1. Check for Choreo-specific paths
  // 2. Check for buildpack environment
  // 3. Check for CNB_* environment variables
  // 4. Check for workspace directory structure
  
  const isChoreoPath = workingDir.includes('/workspace') || workingDir.includes('/cnb/');
  const hasCNBVars = Object.keys(process.env).some(key => key.startsWith('CNB_'));
  const hasBuildpackVars = process.env.STACK_ID || process.env.BPL_JVM_HEAD_ROOM;
  const hasGoogleVars = process.env.GOOGLE_NODEJS_VERSION;
  
  console.log(`  🔍 Choreo Indicators:`);
  console.log(`    - Choreo Path: ${isChoreoPath}`);
  console.log(`    - CNB Variables: ${hasCNBVars}`);
  console.log(`    - Buildpack Variables: ${hasBuildpackVars ? 'yes' : 'no'}`);
  console.log(`    - Google Variables: ${hasGoogleVars ? 'yes' : 'no'}`);
  
  // CHOREO DETECTION LOGIC
  const isChoreo = isChoreoPath || hasCNBVars || hasBuildpackVars || hasGoogleVars;
  
  if (isChoreo) {
    console.log('  🎯 ENVIRONMENT: CHOREO/PRODUCTION');
    return 'PRODUCTION';
  }
  
  // PostgreSQL URL patterns indicate production
  if (databaseUrl && (
    databaseUrl.includes('postgresql://') || 
    databaseUrl.includes('postgres://') ||
    databaseUrl.includes('@') // Any hosted database
  )) {
    console.log('  🎯 ENVIRONMENT: PRODUCTION (PostgreSQL URL detected)');
    return 'PRODUCTION';
  }
  
  // Explicit production indicators
  if (nodeEnv === 'production' || choreoDeployment) {
    console.log('  🎯 ENVIRONMENT: PRODUCTION');
    return 'PRODUCTION';
  }
  
  console.log('  🎯 ENVIRONMENT: DEVELOPMENT');
  return 'DEVELOPMENT';
}

// Verify schema files exist
function verifySchemaFiles() {
  const sqliteSchema = 'prisma/schema.sqlite.prisma';
  const postgresqlSchema = 'prisma/schema.postgresql.prisma';
  
  if (!fs.existsSync(sqliteSchema)) {
    console.error('[SCHEMA SELECTOR] ❌ Missing SQLite schema:', sqliteSchema);
    process.exit(1);
  }
  
  if (!fs.existsSync(postgresqlSchema)) {
    console.error('[SCHEMA SELECTOR] ❌ Missing PostgreSQL schema:', postgresqlSchema);
    process.exit(1);
  }
  
  console.log('[SCHEMA SELECTOR] ✅ All schema files found');
}

// Copy schema file with backup
function copySchema(source, target) {
  // Create backup of existing schema
  if (fs.existsSync(target)) {
    const backup = `${target}.backup.${Date.now()}.prisma`;
    fs.copyFileSync(target, backup);
    console.log(`  📦 Backup created: ${path.basename(backup)}`);
  }
  
  fs.copyFileSync(source, target);
  console.log(`  Source: ${path.basename(source)}`);
  console.log(`  Target: ${path.basename(target)}`);
}

// Validate schema content
function validateSchema(schemaPath, expectedProvider) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('[SCHEMA SELECTOR] 🔍 Current Configuration:');
  
  let inGenerator = false;
  let inDatasource = false;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('generator client')) {
      inGenerator = true;
    } else if (trimmed.startsWith('datasource db')) {
      inDatasource = true;
    } else if (trimmed === '}') {
      inGenerator = false;
      inDatasource = false;
    }
    
    if (inGenerator && (trimmed.includes('provider') || trimmed.includes('binaryTargets'))) {
      console.log(`  ${index + 1}: ${trimmed}`);
    }
    
    if (inDatasource && trimmed.includes('provider')) {
      console.log(`  ${index + 1}: ${trimmed}`);
    }
  });
  
  // Verify provider
  const providerMatch = content.match(/datasource\s+db\s*{[\s\S]*?provider\s*=\s*"([^"]+)"/);
  if (providerMatch) {
    const actualProvider = providerMatch[1];
    if (actualProvider === expectedProvider) {
      console.log(`[SCHEMA SELECTOR] ✅ Schema correctly configured for ${expectedProvider.toUpperCase()}`);
      console.log(`  Provider: ${actualProvider}`);
    } else {
      console.log(`[SCHEMA SELECTOR] ⚠️ Provider mismatch! Expected: ${expectedProvider}, Got: ${actualProvider}`);
    }
  }
}

// Main execution
function main() {
  try {
    const environment = detectEnvironment();
    
    verifySchemaFiles();
    
    const targetSchema = 'prisma/schema.prisma';
    
    if (environment === 'PRODUCTION') {
      console.log('[SCHEMA SELECTOR] 🐘 Copying postgresql schema...');
      copySchema('prisma/schema.postgresql.prisma', targetSchema);
      validateSchema(targetSchema, 'postgresql');
      
      if (process.env.DATABASE_URL) {
        console.log('[SCHEMA SELECTOR] ✅ DATABASE_URL is set');
        console.log(`[SCHEMA SELECTOR] 🔗 URL pattern: ${process.env.DATABASE_URL.substring(0, 20)}...`);
      } else {
        console.log('[SCHEMA SELECTOR] ⚠️ No DATABASE_URL set - will use default from schema');
      }
      
      console.log('[SCHEMA SELECTOR] 🎉 SUCCESS: Schema configured for POSTGRESQL');
      console.log('[SCHEMA SELECTOR] 🌟 Environment: PRODUCTION');
      
    } else {
      console.log('[SCHEMA SELECTOR] 🗃️ Copying sqlite schema...');
      copySchema('prisma/schema.sqlite.prisma', targetSchema);
      validateSchema(targetSchema, 'sqlite');
      
      console.log('[SCHEMA SELECTOR] ⚠️ No DATABASE_URL set - will use default from schema');
      console.log('[SCHEMA SELECTOR] 🎉 SUCCESS: Schema configured for SQLITE');
      console.log('[SCHEMA SELECTOR] 🏠 Environment: DEVELOPMENT');
    }
    
    console.log('[SCHEMA SELECTOR] ✅ Process completed successfully');
    
  } catch (error) {
    console.error('[SCHEMA SELECTOR] ❌ Error during schema selection:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { detectEnvironment, main }; 