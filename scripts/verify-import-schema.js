#!/usr/bin/env node
/**
 * ImportSession Schema Verification Script
 * 
 * This script verifies the ImportSession table structure and model access.
 * It can be run as part of preflight checks before application startup.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Create Prisma client
const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
});

// Configuration
const VERIFICATION_CONFIG = {
  requiredColumns: {
    id: { type: ['String', 'TEXT', 'VARCHAR'], nullable: false },
    filePath: { type: ['String', 'TEXT', 'VARCHAR'], nullable: false },
    status: { type: ['String', 'TEXT', 'VARCHAR'], nullable: false },
    createdById: { type: ['String', 'TEXT', 'VARCHAR'], nullable: false, aliases: ['userId'] },
    createdAt: { type: ['DateTime', 'TIMESTAMP', 'DATETIME'], nullable: false },
  },
  invalidColumns: ['fileName'] // Columns that should NOT be present
};

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

// Log helpers with level control
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL = process.env.LOG_LEVEL ? 
  LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO : 
  LOG_LEVELS.INFO;

function log(level, ...args) {
  if (LOG_LEVELS[level] <= LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    console.log(prefix, ...args);
  }
}

// Check database connection
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    log('INFO', '✅ Database connection successful');
    return true;
  } catch (error) {
    log('ERROR', '❌ Database connection failed:', error.message);
    return false;
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
      const exists = result[0].exists;
      log('INFO', exists ? '✅ ImportSession table exists' : '❌ ImportSession table missing');
      return exists;
    } else {
      // For SQLite
      const result = await prisma.$queryRaw`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='ImportSession';
      `;
      const exists = result.length > 0;
      log('INFO', exists ? '✅ ImportSession table exists' : '❌ ImportSession table missing');
      return exists;
    }
  } catch (error) {
    log('ERROR', '❌ Error checking table existence:', error.message);
    return false;
  }
}

// Get ImportSession schema details
async function getSchemaDetails() {
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
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ImportSession'
        ORDER BY ordinal_position;
      `;
      
      log('DEBUG', 'Retrieved columns from PostgreSQL:', columns);
    } else {
      // For SQLite
      const pragmaInfo = await prisma.$queryRaw`PRAGMA table_info("ImportSession");`;
      columns = pragmaInfo.map(col => ({
        column_name: col.name,
        data_type: col.type,
        is_nullable: col.notnull === 0 ? 'YES' : 'NO',
        column_default: col.dflt_value,
        character_maximum_length: null // SQLite doesn't provide this info in the same way
      }));
      
      log('DEBUG', 'Retrieved columns from SQLite:', columns);
    }
    
    return {
      tableExists: true,
      columns
    };
  } catch (error) {
    log('ERROR', '❌ Error getting schema details:', error);
    return {
      tableExists: false,
      columns: [],
      error: error.message
    };
  }
}

// Verify schema structure
async function verifySchemaStructure() {
  const schemaDetails = await getSchemaDetails();
  
  if (!schemaDetails.tableExists) {
    return {
      status: 'FAIL',
      message: 'ImportSession table does not exist',
      details: { tableExists: false }
    };
  }
  
  const issues = [];
  const columnsFound = [];
  
  // Check for required columns
  for (const [colName, config] of Object.entries(VERIFICATION_CONFIG.requiredColumns)) {
    // Check for the column name or any aliases
    const allPossibleNames = [colName, ...(config.aliases || [])];
    const foundColumn = schemaDetails.columns.find(c => 
      allPossibleNames.includes(c.column_name)
    );
    
    if (!foundColumn) {
      issues.push({
        type: 'MISSING_COLUMN',
        columnName: colName,
        message: `Required column '${colName}' is missing`
      });
    } else {
      const columnName = foundColumn.column_name;
      
      // Check type compatibility (basic check, could be expanded)
      const typeMatches = config.type.some(t => 
        foundColumn.data_type.toUpperCase().includes(t.toUpperCase())
      );
      
      if (!typeMatches) {
        issues.push({
          type: 'WRONG_TYPE',
          columnName,
          expected: config.type.join(' or '),
          actual: foundColumn.data_type,
          message: `Column '${columnName}' has wrong type: expected ${config.type.join(' or ')}, got ${foundColumn.data_type}`
        });
      }
      
      // Check nullability
      const isNullable = foundColumn.is_nullable === 'YES';
      if (isNullable !== !!config.nullable) {
        issues.push({
          type: 'WRONG_NULLABILITY',
          columnName,
          expected: config.nullable ? 'nullable' : 'not nullable',
          actual: isNullable ? 'nullable' : 'not nullable',
          message: `Column '${columnName}' has wrong nullability: expected ${config.nullable ? 'nullable' : 'not nullable'}, got ${isNullable ? 'nullable' : 'not nullable'}`
        });
      }
      
      columnsFound.push({
        name: columnName,
        type: foundColumn.data_type,
        nullable: isNullable,
        default: foundColumn.column_default,
        maxLength: foundColumn.character_maximum_length
      });
    }
  }
  
  // Check for invalid columns
  for (const invalidCol of VERIFICATION_CONFIG.invalidColumns) {
    if (schemaDetails.columns.some(c => c.column_name === invalidCol)) {
      issues.push({
        type: 'INVALID_COLUMN',
        columnName: invalidCol,
        message: `Column '${invalidCol}' should not exist but is present`
      });
    }
  }
  
  return {
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    message: issues.length === 0 ? 
      'ImportSession schema structure is correct' : 
      `ImportSession schema has ${issues.length} issue(s)`,
    columnsFound,
    issues
  };
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
    
    if (!hasModel) {
      return {
        status: 'FAIL',
        message: 'ImportSession model not found in Prisma client',
        details: {
          hasModel: false,
          availableModels: modelNames
        }
      };
    }
    
    // Test basic operations
    try {
      // Try count operation
      await prisma.importSession.count();
      log('INFO', '✅ Successfully executed count() on ImportSession model');
      
      // Try findMany with limit
      await prisma.importSession.findMany({
        take: 1
      });
      log('INFO', '✅ Successfully executed findMany() on ImportSession model');
      
      return {
        status: 'PASS',
        message: 'ImportSession model is accessible and operational',
        details: {
          hasModel: true,
          operationsTested: ['count', 'findMany']
        }
      };
    } catch (opError) {
      log('ERROR', '❌ Model operations failed:', opError);
      return {
        status: 'FAIL',
        message: `ImportSession model exists but operations failed: ${opError.message}`,
        details: {
          hasModel: true,
          error: opError.message
        }
      };
    }
  } catch (error) {
    log('ERROR', '❌ Error verifying model access:', error);
    return {
      status: 'FAIL',
      message: `Error verifying model access: ${error.message}`,
      details: {
        error: error.message
      }
    };
  }
}

// Check for Prisma schema file
function checkPrismaSchemaFile() {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  try {
    if (!fs.existsSync(schemaPath)) {
      return {
        status: 'FAIL',
        message: 'Prisma schema file not found',
        path: schemaPath
      };
    }
    
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    // Check if ImportSession model is defined in the schema
    const hasImportSessionModel = content.includes('model ImportSession');
    
    // Check required fields in schema
    const requiredFields = ['id', 'filePath', 'status', 'createdById', 'createdAt'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      // Allow for both createdById and userId
      const fieldPattern = field === 'createdById' ? 
        /(createdById|userId)\s*\w+/ : 
        new RegExp(`${field}\\s+\\w+`);
      
      if (!fieldPattern.test(content)) {
        missingFields.push(field);
      }
    }
    
    // Check for fileName field which should not exist
    const hasFileNameField = /fileName\s+\w+/.test(content);
    
    return {
      status: hasImportSessionModel && missingFields.length === 0 && !hasFileNameField ? 'PASS' : 'FAIL',
      message: hasImportSessionModel ? 
        (missingFields.length === 0 && !hasFileNameField ? 
          'Prisma schema file contains valid ImportSession model' : 
          'Prisma schema file contains ImportSession model but with issues') :
        'ImportSession model not defined in Prisma schema',
      details: {
        path: schemaPath,
        hasImportSessionModel,
        missingFields,
        hasFileNameField
      }
    };
  } catch (error) {
    log('ERROR', '❌ Error checking Prisma schema file:', error);
    return {
      status: 'FAIL',
      message: `Error checking Prisma schema file: ${error.message}`,
      path: schemaPath,
      error: error.message
    };
  }
}

// Generate summary report
function generateReport(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    environment: detectEnvironment(),
    overallStatus: Object.values(results).every(r => r.status === 'PASS') ? 'PASS' : 'FAIL',
    checks: results
  };
  
  // Calculate overall message
  const failingChecks = Object.entries(results)
    .filter(([_, result]) => result.status === 'FAIL')
    .map(([name, _]) => name);
  
  summary.message = summary.overallStatus === 'PASS' ?
    'All ImportSession schema verification checks passed' :
    `ImportSession schema verification failed: issues in ${failingChecks.join(', ')}`;
  
  return summary;
}

// Main verification function
async function verifyImportSession() {
  log('INFO', '🔍 Starting ImportSession schema verification...');
  log('INFO', '🌍 Environment:', detectEnvironment());
  
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return {
        status: 'FAIL',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      };
    }
    
    // Run all verification checks
    const results = {
      prismaSchemaFile: checkPrismaSchemaFile(),
      tableStructure: await verifySchemaStructure(),
      modelAccess: await verifyModelAccess()
    };
    
    // Generate report
    const report = generateReport(results);
    
    // Log summary
    log('INFO', '📋 Verification complete:', report.message);
    log('INFO', `Status: ${report.overallStatus}`);
    
    for (const [check, result] of Object.entries(results)) {
      log(result.status === 'PASS' ? 'INFO' : 'ERROR', 
          `${result.status === 'PASS' ? '✅' : '❌'} ${check}: ${result.message}`);
    }
    
    // Save report if requested
    if (process.env.SAVE_REPORT === 'true') {
      const reportPath = path.join(process.cwd(), 'import-session-verification.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      log('INFO', `📄 Report saved to ${reportPath}`);
    }
    
    return report;
  } catch (error) {
    log('ERROR', '❌ Verification failed:', error);
    return {
      status: 'FAIL',
      message: `Verification failed with error: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run as main or export for importing
if (require.main === module) {
  // Run as standalone script
  verifyImportSession()
    .then(report => {
      process.exit(report.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  // Export for importing in other modules
  module.exports = {
    verifyImportSession,
    checkDatabaseConnection,
    checkTableExists,
    verifySchemaStructure,
    verifyModelAccess
  };
} 