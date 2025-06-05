#!/usr/bin/env node
/**
 * ImportSession Migration Audit Script
 * 
 * This script audits all ImportSession-related migrations and verifies 
 * their application in different environments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Create Prisma client
const prisma = new PrismaClient();

// Configuration
const MIGRATION_DIRS = [
  path.join(process.cwd(), 'prisma/migrations')
];

// Environment detection
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

// Find all migrations related to ImportSession
async function findImportSessionMigrations() {
  const migrations = [];

  for (const dir of MIGRATION_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`📂 Directory ${dir} does not exist`);
      continue;
    }

    console.log(`📂 Scanning directory: ${dir}`);
    
    // Read all subdirectories (each is a migration)
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const migrationDir = path.join(dir, item);
      if (fs.statSync(migrationDir).isDirectory()) {
        // Check for migration files
        const migrationFiles = fs.readdirSync(migrationDir)
          .filter(file => file.endsWith('.sql') || file.endsWith('.js'));
        
        // Look for ImportSession references
        let hasImportSessionReference = false;
        let contents = "";
        
        for (const file of migrationFiles) {
          const filePath = path.join(migrationDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('ImportSession')) {
            hasImportSessionReference = true;
            contents = content;
            break;
          }
        }
        
        if (hasImportSessionReference) {
          migrations.push({
            name: item,
            path: migrationDir,
            contents,
            files: migrationFiles
          });
        }
      }
    }
  }

  return migrations;
}

// Check if a migration has been applied
async function checkMigrationApplied(migration) {
  try {
    // For PostgreSQL, check the _prisma_migrations table
    const isPg = detectEnvironment().isPg;
    
    if (isPg) {
      const results = await prisma.$queryRaw`
        SELECT * FROM _prisma_migrations 
        WHERE migration_name = ${migration.name}
        AND applied_steps_count > 0
      `;
      
      return {
        applied: results && results.length > 0,
        details: results && results.length > 0 ? results[0] : null
      };
    } else {
      // For SQLite, check if table exists as a proxy for migration being applied
      const tableExists = await checkTableExists();
      return {
        applied: tableExists,
        details: { table_exists: tableExists }
      };
    }
  } catch (error) {
    console.error(`❌ Error checking migration ${migration.name}:`, error);
    return {
      applied: false,
      details: { error: error.message }
    };
  }
}

// Check if ImportSession table exists
async function checkTableExists() {
  try {
    const isPg = detectEnvironment().isPg;
    
    if (isPg) {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ImportSession'
        );
      `;
      return result[0].exists;
    } else {
      // For SQLite
      const result = await prisma.$queryRaw`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='ImportSession';
      `;
      return result.length > 0;
    }
  } catch (error) {
    console.error('❌ Error checking table existence:', error);
    return false;
  }
}

// Check ImportSession schema structure
async function checkImportSessionSchema() {
  const isPg = detectEnvironment().isPg;
  
  try {
    // Check if the table exists first
    const tableExists = await checkTableExists();
    if (!tableExists) {
      return {
        tableExists: false,
        columns: []
      };
    }
    
    // Get column information
    let columns = [];
    
    if (isPg) {
      columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ImportSession'
        ORDER BY ordinal_position;
      `;
    } else {
      // For SQLite
      const pragmaInfo = await prisma.$queryRaw`PRAGMA table_info("ImportSession");`;
      columns = pragmaInfo.map(col => ({
        column_name: col.name,
        data_type: col.type,
        is_nullable: col.notnull === 0 ? 'YES' : 'NO'
      }));
    }
    
    return {
      tableExists: true,
      columns
    };
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return {
      tableExists: false,
      columns: [],
      error: error.message
    };
  }
}

// Verify schema matches expected structure
async function verifySchema() {
  const schema = await checkImportSessionSchema();
  
  // Define expected columns (based on current needs)
  const expectedColumns = [
    { name: 'id', required: true },
    { name: 'filePath', required: true },
    { name: 'status', required: true },
    { name: 'createdById', required: true }, // or userId
    { name: 'createdAt', required: true }
  ];
  
  // Check for required columns
  const results = {
    tableExists: schema.tableExists,
    missingColumns: [],
    unexpectedColumns: [],
    columnsPresent: []
  };
  
  if (!schema.tableExists) {
    results.verdict = "FAIL - Table does not exist";
    return results;
  }
  
  // Check expected columns
  for (const expected of expectedColumns) {
    const found = schema.columns.find(c => 
      c.column_name === expected.name || 
      (expected.name === 'createdById' && c.column_name === 'userId')
    );
    
    if (!found && expected.required) {
      results.missingColumns.push(expected.name);
    } else if (found) {
      results.columnsPresent.push({
        name: found.column_name,
        type: found.data_type,
        nullable: found.is_nullable
      });
    }
  }
  
  // Check for fileName column which should NOT exist
  const hasFileNameColumn = schema.columns.some(c => c.column_name === 'fileName');
  if (hasFileNameColumn) {
    results.unexpectedColumns.push('fileName');
  }
  
  // Final verdict
  if (results.missingColumns.length > 0 || results.unexpectedColumns.length > 0) {
    results.verdict = "FAIL - Schema issues detected";
  } else {
    results.verdict = "PASS - Schema structure is correct";
  }
  
  return results;
}

// Verify model access
async function verifyModelAccess() {
  try {
    // Check if Prisma client has ImportSession model
    const modelNames = Object.keys(prisma).filter(key => 
      !key.startsWith('_') && 
      !key.startsWith('$') && 
      typeof prisma[key] === 'object'
    );
    
    const hasModel = modelNames.includes('importSession');
    
    // Attempt a simple operation if model exists
    let operationSucceeded = false;
    if (hasModel) {
      try {
        // Try a count operation
        await prisma.importSession?.count();
        operationSucceeded = true;
      } catch (opError) {
        console.error('❌ Model exists but operation failed:', opError);
      }
    }
    
    return {
      hasModel,
      operationSucceeded,
      modelNames
    };
  } catch (error) {
    console.error('❌ Error verifying model access:', error);
    return {
      hasModel: false,
      operationSucceeded: false,
      error: error.message
    };
  }
}

// Run schema fixes and verify
async function testSchemaFixes() {
  console.log('🧪 Testing schema fixes...');
  
  // First check current state
  console.log('📊 Current schema state:');
  const beforeSchema = await verifySchema();
  const beforeAccess = await verifyModelAccess();
  
  console.log(JSON.stringify(beforeSchema, null, 2));
  console.log(JSON.stringify(beforeAccess, null, 2));
  
  // Run fixes
  console.log('🔧 Running schema fixes...');
  
  const env = detectEnvironment();
  const fixScript = env.isPg ? 'fix-import-session-postgres.js' : 'fix-import-session-sqlite.js';
  
  try {
    console.log(`🚀 Executing ${fixScript}...`);
    const result = execSync(`node scripts/${fixScript}`, { encoding: 'utf8' });
    console.log(result);
    
    // Check state after fixes
    console.log('📊 Schema state after fixes:');
    const afterSchema = await verifySchema();
    const afterAccess = await verifyModelAccess();
    
    console.log(JSON.stringify(afterSchema, null, 2));
    console.log(JSON.stringify(afterAccess, null, 2));
    
    return {
      beforeFix: { schema: beforeSchema, access: beforeAccess },
      afterFix: { schema: afterSchema, access: afterAccess },
      fixSucceeded: afterSchema.verdict.startsWith('PASS') && afterAccess.operationSucceeded
    };
  } catch (error) {
    console.error('❌ Error running schema fixes:', error);
    return {
      beforeFix: { schema: beforeSchema, access: beforeAccess },
      error: error.message,
      fixSucceeded: false
    };
  }
}

// Summary helper
function generateSummary(migrations, verifications) {
  return {
    environment: detectEnvironment(),
    migrationsFound: migrations.length,
    migrationsDetails: migrations.map(m => ({ 
      name: m.name, 
      applied: m.applied,
      appliedAt: m.details?.finished_at || 'unknown'
    })),
    schemaVerification: verifications.schema,
    modelAccessVerification: verifications.model,
    fixTestResults: verifications.fixTest,
    timestamp: new Date().toISOString(),
    overallVerdict: 
      verifications.schema.verdict.startsWith('PASS') && 
      verifications.model.operationSucceeded ? 
      'PASS - Schema is correct and model is accessible' : 
      'FAIL - Issues detected with schema structure or model access'
  };
}

// Main function
async function main() {
  console.log('🔍 Starting ImportSession migration audit...');
  console.log('🌍 Environment:', detectEnvironment());
  
  try {
    // Connect to the database
    await prisma.$connect();
    
    // Find migrations
    console.log('\n📋 Finding ImportSession-related migrations...');
    const migrations = await findImportSessionMigrations();
    console.log(`Found ${migrations.length} migrations related to ImportSession`);
    
    // Check each migration
    console.log('\n🔍 Checking migration status...');
    for (const migration of migrations) {
      console.log(`\nMigration: ${migration.name}`);
      const status = await checkMigrationApplied(migration);
      migration.applied = status.applied;
      migration.details = status.details;
      
      console.log(`  - Applied: ${status.applied ? 'Yes' : 'No'}`);
      if (status.details) {
        console.log('  - Details:', JSON.stringify(status.details));
      }
    }
    
    // Verify schema structure
    console.log('\n🔍 Verifying ImportSession schema structure...');
    const schemaVerification = await verifySchema();
    console.log('Schema verification:', schemaVerification.verdict);
    
    // Verify model access
    console.log('\n🔍 Verifying ImportSession model access...');
    const modelVerification = await verifyModelAccess();
    console.log('Model access:', modelVerification.hasModel ? 
      (modelVerification.operationSucceeded ? 'PASS - Model accessible' : 'FAIL - Model exists but operation failed') :
      'FAIL - Model not found');
    
    // Test schema fixes
    console.log('\n🔍 Testing schema fixes...');
    const fixTest = await testSchemaFixes();
    console.log('Fix test:', fixTest.fixSucceeded ? 'PASS - Fixes work correctly' : 'FAIL - Fixes did not resolve issues');
    
    // Generate summary
    const summary = generateSummary(migrations, {
      schema: schemaVerification,
      model: modelVerification,
      fixTest
    });
    
    console.log('\n📋 Audit Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
    // Save report
    const reportPath = path.join(process.cwd(), 'import-session-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n✅ Audit report saved to ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(summary.overallVerdict.startsWith('PASS') ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main(); 