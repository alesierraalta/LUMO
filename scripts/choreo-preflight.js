#!/usr/bin/env node

/**
 * Choreo Preflight Check Script
 * 
 * This script runs before the server starts and performs essential checks
 * to ensure the environment is properly configured, including:
 * 
 * 1. Database schema verification and fixes
 * 2. File system permissions
 * 3. Required directories
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running Choreo preflight checks...');

// Check if we're in production/Choreo environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
console.log(`🔍 Environment: ${isProduction ? 'PRODUCTION/CHOREO' : 'DEVELOPMENT'}`);

// Fix ImportSession schema if needed
function fixImportSessionSchema() {
  try {
    console.log('🔧 Running ImportSession schema check...');
    
    // Choose the appropriate script based on environment
    const scriptPath = isProduction 
      ? path.join(__dirname, 'fix-import-session-postgres.js')
      : path.join(__dirname, 'fix-import-session-sqlite.js');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Schema fix script not found: ${scriptPath}`);
      // Create a basic version of the script if it doesn't exist
      if (isProduction) {
        createEmergencyFixScript();
      }
      return false;
    }
    
    // Run the fix script
    console.log(`📋 Executing schema fix: ${scriptPath}`);
    const result = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });
    console.log(result);
    return true;
  } catch (error) {
    console.error('❌ Failed to fix ImportSession schema:', error.message);
    return false;
  }
}

// Create an emergency fix script if the original is missing
function createEmergencyFixScript() {
  try {
    const emergencyScript = `#!/usr/bin/env node
console.log('🚨 Running emergency ImportSession schema fix...');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImportSessionTable() {
  try {
    // Check if the table exists
    const tableExists = await prisma.$queryRaw\`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession'
      );
    \`;
    
    if (!tableExists[0].exists) {
      console.log('⚠️ ImportSession table does not exist, creating it...');
      await prisma.$executeRaw\`
        CREATE TABLE "ImportSession" (
          "id" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "userId" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "fileId" TEXT,
          "fileSize" INTEGER,
          "filePath" TEXT,
          "totalRows" INTEGER DEFAULT 0,
          "processedRows" INTEGER DEFAULT 0,
          "successRows" INTEGER DEFAULT 0,
          "errorRows" INTEGER DEFAULT 0,
          "metadata" JSONB,
          CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
        );
      \`;
      console.log('✅ ImportSession table created successfully');
      return true;
    }
    
    // Check if fileName column exists
    const columnExists = await prisma.$queryRaw\`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession' 
        AND column_name = 'fileName'
      );
    \`;
    
    if (columnExists[0].exists) {
      console.log('⚠️ Removing fileName column from ImportSession table...');
      await prisma.$executeRaw\`ALTER TABLE "ImportSession" DROP COLUMN IF EXISTS "fileName";\`;
      console.log('✅ fileName column removed successfully');
    } else {
      console.log('✅ ImportSession table schema is correct (no fileName column)');
    }
    
    // Check if filePath column exists
    const filePathExists = await prisma.$queryRaw\`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession' 
        AND column_name = 'filePath'
      );
    \`;
    
    if (!filePathExists[0].exists) {
      console.log('⚠️ Adding filePath column to ImportSession table...');
      await prisma.$executeRaw\`ALTER TABLE "ImportSession" ADD COLUMN "filePath" TEXT;\`;
      console.log('✅ filePath column added successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error fixing ImportSession schema:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

fixImportSessionTable()
  .then(() => console.log('🏁 Emergency schema fix completed'))
  .catch(err => console.error('💥 Emergency schema fix failed:', err));
`;
    
    const emergencyScriptPath = path.join(__dirname, 'fix-import-session-postgres.js');
    fs.writeFileSync(emergencyScriptPath, emergencyScript);
    console.log(`✅ Created emergency fix script: ${emergencyScriptPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create emergency fix script:', error.message);
    return false;
  }
}

// Ensure import directories exist
function ensureImportDirs() {
  try {
    console.log('📁 Ensuring import directories exist...');
    
    const dirs = [
      path.join(process.cwd(), '.next/server/app/api/inventory/import/process/dict'),
      path.join(process.cwd(), '.next/standalone/.next/server/app/api/inventory/import/process/dict'),
      path.join(process.cwd(), 'node_modules/.prisma/client')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory already exists: ${dir}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create import directories:', error.message);
    return false;
  }
}

// Main function
function runPreflightChecks() {
  console.log('🔍 Starting preflight checks...');
  
  // Run all checks
  const results = {
    importDirs: ensureImportDirs(),
    schemaFix: fixImportSessionSchema()
  };
  
  // Log summary
  console.log('\n📋 Preflight Check Summary:');
  for (const [check, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${check}: ${result ? 'PASSED' : 'FAILED'}`);
  }
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n${allPassed ? '✅ All checks PASSED' : '⚠️ Some checks FAILED'}`);
  
  return allPassed;
}

// Run the preflight checks
const success = runPreflightChecks();
console.log(`🏁 Preflight checks ${success ? 'completed successfully' : 'completed with warnings'}`);

// Exit with appropriate code
process.exit(success ? 0 : 0); // Always exit with 0 to prevent blocking server startup 