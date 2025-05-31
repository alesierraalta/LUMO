#!/usr/bin/env node

/**
 * Dynamic Prisma Schema Selector
 * Automatically selects and copies the appropriate schema based on environment
 * Supports SQLite (development) and PostgreSQL (production)
 */

const fs = require('fs');
const path = require('path');

console.log('[SCHEMA SELECTOR] 🚀 Starting dynamic schema selection...');

const schemaDir = path.join(process.cwd(), 'prisma');
const targetSchemaPath = path.join(schemaDir, 'schema.prisma');
const sqliteSchemaPath = path.join(schemaDir, 'schema.sqlite.prisma');
const postgresSchemaPath = path.join(schemaDir, 'schema.postgresql.prisma');

// Enhanced environment detection
const detectEnvironment = () => {
  const indicators = {
    nodeEnv: process.env.NODE_ENV,
    choreoDeployment: process.env.CHOREO_DEPLOYMENT,
    databaseUrl: process.env.DATABASE_URL,
    forcePostgres: process.argv.includes('--force-postgresql'),
    forceSqlite: process.argv.includes('--force-sqlite')
  };

  console.log('[SCHEMA SELECTOR] 🔍 Environment Detection:');
  console.log(`  NODE_ENV: ${indicators.nodeEnv || 'not-set'}`);
  console.log(`  CHOREO_DEPLOYMENT: ${indicators.choreoDeployment || 'not-set'}`);
  console.log(`  DATABASE_URL: ${indicators.databaseUrl ? 'set' : 'not-set'}`);
  
  if (indicators.databaseUrl) {
    const urlType = indicators.databaseUrl.includes('postgres') ? 'PostgreSQL' : 
                    indicators.databaseUrl.includes('file:') ? 'SQLite' : 'Unknown';
    console.log(`  DATABASE_URL type: ${urlType}`);
    console.log(`  DATABASE_URL preview: ${indicators.databaseUrl.substring(0, 30)}...`);
  }

  // Force flags take precedence
  if (indicators.forcePostgres) {
    console.log('  🎯 FORCED: PostgreSQL via --force-postgresql flag');
    return 'postgresql';
  }
  
  if (indicators.forceSqlite) {
    console.log('  🎯 FORCED: SQLite via --force-sqlite flag');
    return 'sqlite';
  }

  // CHOREO_DEPLOYMENT takes high priority for production detection
  if (indicators.choreoDeployment === 'true') {
    console.log('  🎯 CHOREO DEPLOYMENT DETECTED: Forcing PostgreSQL');
    return 'postgresql';
  }

  // Production environment detection with stronger PostgreSQL bias
  const isProduction = 
    indicators.nodeEnv === 'production' ||
    (indicators.databaseUrl && indicators.databaseUrl.includes('postgres'));

  console.log(`  🎯 ENVIRONMENT: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  return isProduction ? 'postgresql' : 'sqlite';
};

// Validate schema files exist
const validateSchemaFiles = () => {
  const missing = [];
  
  if (!fs.existsSync(sqliteSchemaPath)) {
    missing.push('schema.sqlite.prisma');
  }
  
  if (!fs.existsSync(postgresSchemaPath)) {
    missing.push('schema.postgresql.prisma');
  }

  if (missing.length > 0) {
    console.error(`[SCHEMA SELECTOR] ❌ Missing schema files: ${missing.join(', ')}`);
    console.error('[SCHEMA SELECTOR] Please ensure both schema files exist in the prisma directory');
    process.exit(1);
  }

  console.log('[SCHEMA SELECTOR] ✅ All schema files found');
};

// Copy and verify schema
const copySchema = (sourceFile, environment) => {
  try {
    console.log(`[SCHEMA SELECTOR] 📋 Copying ${environment} schema...`);
    console.log(`  Source: ${path.basename(sourceFile)}`);
    console.log(`  Target: schema.prisma`);

    // Read source schema
    const sourceContent = fs.readFileSync(sourceFile, 'utf8');
    
    // Backup current schema if it exists
    if (fs.existsSync(targetSchemaPath)) {
      const backupPath = path.join(schemaDir, `schema.backup.${Date.now()}.prisma`);
      fs.copyFileSync(targetSchemaPath, backupPath);
      console.log(`  📦 Backup created: ${path.basename(backupPath)}`);
    }

    // Write new schema
    fs.writeFileSync(targetSchemaPath, sourceContent);
    
    // Verify the copy
    const verifyContent = fs.readFileSync(targetSchemaPath, 'utf8');
    const providerMatch = verifyContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
    
    if (!providerMatch) {
      console.error('[SCHEMA SELECTOR] ❌ Verification failed: No provider found in copied schema');
      process.exit(1);
    }

    const actualProvider = providerMatch[1];
    if (actualProvider !== environment) {
      console.error(`[SCHEMA SELECTOR] ❌ Verification failed: Expected ${environment}, got ${actualProvider}`);
      process.exit(1);
    }

    console.log(`[SCHEMA SELECTOR] ✅ Schema successfully configured for ${environment.toUpperCase()}`);
    console.log(`  Provider: ${actualProvider}`);
    
    // Show relevant configuration lines
    const lines = verifyContent.split('\n');
    console.log('[SCHEMA SELECTOR] 📋 Current Configuration:');
    lines.forEach((line, index) => {
      if (line.includes('provider') || line.includes('datasource') || line.includes('binaryTargets')) {
        console.log(`  ${index + 1}: ${line.trim()}`);
      }
    });

    return true;
  } catch (error) {
    console.error('[SCHEMA SELECTOR] ❌ Copy failed:', error.message);
    process.exit(1);
  }
};

// Validate DATABASE_URL compatibility
const validateDatabaseUrl = (environment) => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('[SCHEMA SELECTOR] ⚠️ No DATABASE_URL set - will use default from schema');
    return;
  }

  const urlIsPostgres = databaseUrl.includes('postgres');
  const urlIsSqlite = databaseUrl.includes('file:');
  
  if (environment === 'postgresql' && !urlIsPostgres) {
    console.error('[SCHEMA SELECTOR] ❌ MISMATCH: PostgreSQL schema but DATABASE_URL is not PostgreSQL');
    console.error(`  URL: ${databaseUrl.substring(0, 30)}...`);
    process.exit(1);
  }
  
  if (environment === 'sqlite' && urlIsPostgres) {
    console.log('[SCHEMA SELECTOR] ⚠️ WARNING: SQLite schema but DATABASE_URL looks like PostgreSQL');
    console.log(`  URL: ${databaseUrl.substring(0, 30)}...`);
    console.log('  This might be intentional for testing purposes');
  }

  console.log('[SCHEMA SELECTOR] ✅ DATABASE_URL compatibility verified');
};

// Main execution
try {
  const environment = detectEnvironment();
  
  validateSchemaFiles();
  
  const sourceFile = environment === 'postgresql' ? postgresSchemaPath : sqliteSchemaPath;
  
  copySchema(sourceFile, environment);
  
  validateDatabaseUrl(environment);
  
  console.log(`[SCHEMA SELECTOR] 🎉 SUCCESS: Schema configured for ${environment.toUpperCase()}`);
  console.log(`[SCHEMA SELECTOR] 🌍 Environment: ${environment === 'postgresql' ? 'PRODUCTION' : 'DEVELOPMENT'}`);

} catch (error) {
  console.error('[SCHEMA SELECTOR] ❌ CRITICAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('[SCHEMA SELECTOR] ✅ Process completed successfully'); 