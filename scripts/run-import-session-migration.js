#!/usr/bin/env node
/**
 * ImportSession Migration Runner
 * 
 * This script automatically runs the appropriate ImportSession migration
 * based on the current environment (SQLite for development, PostgreSQL for production).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Log with timestamps
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Detect environment
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
  const isPg = process.env.DATABASE_URL?.includes('postgresql') || 
               process.env.DATABASE_URL?.includes('postgres');
  
  return {
    nodeEnv,
    isProduction,
    isPg,
    databaseType: isPg ? 'postgresql' : 'sqlite',
    provider: isPg ? 'postgresql' : 'sqlite'
  };
}

// Run SQL script directly
async function runSqlScript(scriptPath) {
  const env = detectEnvironment();
  
  try {
    log('INFO', `Running SQL script: ${scriptPath}`);
    const sql = fs.readFileSync(scriptPath, 'utf8');
    
    // Create Prisma client
    const prisma = new PrismaClient();
    
    try {
      // Connect to the database
      await prisma.$connect();
      
      // Split the SQL script into statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Special handling for PostgreSQL DO blocks
      if (env.isPg) {
        const doBlocks = [];
        let currentBlock = '';
        let insideDoBlock = false;
        
        for (const statement of statements) {
          if (statement.toUpperCase().startsWith('DO ')) {
            insideDoBlock = true;
            currentBlock = statement;
          } else if (insideDoBlock) {
            currentBlock += ';' + statement;
            if (statement.includes('$$')) {
              insideDoBlock = false;
              doBlocks.push(currentBlock);
              currentBlock = '';
            }
          } else {
            doBlocks.push(statement);
          }
        }
        
        for (const block of doBlocks) {
          if (block.trim()) {
            log('DEBUG', `Executing block: ${block.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(`${block};`);
          }
        }
      } else {
        // SQLite execution - run each statement separately
        for (const statement of statements) {
          if (statement.trim()) {
            log('DEBUG', `Executing statement: ${statement.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(`${statement};`);
          }
        }
      }
      
      log('INFO', '✅ SQL script executed successfully');
      return true;
    } catch (error) {
      log('ERROR', '❌ Error executing SQL script:', error);
      return false;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    log('ERROR', '❌ Error reading SQL script:', error);
    return false;
  }
}

// Run migration
async function runMigration() {
  const env = detectEnvironment();
  log('INFO', '🚀 Running ImportSession migration in', env.databaseType, 'environment');
  
  // Find appropriate migration script
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    log('ERROR', '❌ Migrations directory not found:', migrationsDir);
    return false;
  }
  
  const migrationScriptName = env.isPg ? 
    '20250607_fix_import_session_comprehensive' : 
    '20250607_fix_import_session_sqlite';
  
  const migrationDir = path.join(migrationsDir, migrationScriptName);
  
  if (!fs.existsSync(migrationDir)) {
    // Try running the fix script directly if migration not found
    log('WARN', `Migration directory not found: ${migrationDir}`);
    log('INFO', 'Trying direct fix script instead...');
    
    const fixScript = env.isPg ? 
      path.join(process.cwd(), 'scripts', 'fix-import-session-postgres.js') : 
      path.join(process.cwd(), 'scripts', 'fix-import-session-sqlite.js');
    
    if (!fs.existsSync(fixScript)) {
      log('ERROR', `Fix script not found: ${fixScript}`);
      return false;
    }
    
    try {
      log('INFO', `Running fix script: ${fixScript}`);
      execSync(`node "${fixScript}"`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      log('ERROR', 'Failed to run fix script:', error.message);
      return false;
    }
  }
  
  // Find migration SQL file
  const migrationFile = path.join(migrationDir, 'migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    log('ERROR', `Migration SQL file not found: ${migrationFile}`);
    return false;
  }
  
  // Run the migration
  return await runSqlScript(migrationFile);
}

// Record migration in _prisma_migrations table for PostgreSQL
async function recordMigration() {
  const env = detectEnvironment();
  
  // Only needed for PostgreSQL
  if (!env.isPg) {
    return true;
  }
  
  try {
    log('INFO', 'Recording migration in _prisma_migrations table');
    
    // Create Prisma client
    const prisma = new PrismaClient();
    
    try {
      // Connect to the database
      await prisma.$connect();
      
      // Check if migration already recorded
      const migrationName = '20250607_fix_import_session_comprehensive';
      const existingMigration = await prisma.$queryRaw`
        SELECT * FROM _prisma_migrations 
        WHERE migration_name = ${migrationName}
      `;
      
      if (existingMigration && existingMigration.length > 0) {
        log('INFO', 'Migration already recorded in _prisma_migrations table');
        return true;
      }
      
      // Record the migration
      await prisma.$executeRaw`
        INSERT INTO _prisma_migrations (
          id, 
          migration_name, 
          started_at, 
          finished_at, 
          applied_steps_count
        ) VALUES (
          gen_random_uuid(),
          ${migrationName},
          NOW(),
          NOW(),
          1
        )
      `;
      
      log('INFO', '✅ Migration recorded in _prisma_migrations table');
      return true;
    } catch (error) {
      log('ERROR', '❌ Error recording migration:', error);
      log('WARN', 'Migration may have applied but wasn\'t recorded');
      return true; // Still return true as the migration likely succeeded
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    log('ERROR', '❌ Error recording migration:', error);
    return true; // Still return true as the migration likely succeeded
  }
}

// Main function
async function main() {
  log('INFO', '🚀 Starting ImportSession migration runner');
  log('INFO', '🌍 Environment:', detectEnvironment());
  
  try {
    // Run migration
    const migrationSuccess = await runMigration();
    
    if (migrationSuccess) {
      // Record migration
      await recordMigration();
      
      log('INFO', '✅ ImportSession migration completed successfully');
      return true;
    } else {
      log('ERROR', '❌ ImportSession migration failed');
      return false;
    }
  } catch (error) {
    log('ERROR', '❌ Migration runner failed with error:', error);
    return false;
  }
}

// Run as main or export for importing
if (require.main === module) {
  // Run as standalone script
  main()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      log('ERROR', '💥 Fatal error:', error);
      process.exit(1);
    });
} else {
  // Export for importing in other modules
  module.exports = {
    runMigration,
    detectEnvironment
  };
} 