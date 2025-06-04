#!/usr/bin/env node

/**
 * ImportSession PostgreSQL Schema Fix
 * 
 * This script fixes the ImportSession table schema in PostgreSQL databases.
 * Specifically, it addresses the issue with the "fileName" column
 * which was replaced with "filePath" in newer schema versions.
 */

console.log('🔧 ImportSession PostgreSQL Schema Fix');
console.log('======================================');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableExists() {
  try {
    console.log('🔍 Checking if ImportSession table exists...');
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession'
      );
    `;
    return result[0].exists;
  } catch (error) {
    console.error('❌ Error checking table existence:', error);
    return false;
  }
}

async function checkColumnExists(columnName) {
  try {
    console.log(`🔍 Checking if column '${columnName}' exists in ImportSession table...`);
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession' 
        AND column_name = ${columnName}
      );
    `;
    return result[0].exists;
  } catch (error) {
    console.error(`❌ Error checking column '${columnName}' existence:`, error);
    return false;
  }
}

async function createImportSessionTable() {
  try {
    console.log('📝 Creating ImportSession table from scratch...');
    await prisma.$executeRaw`
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
    `;
    console.log('✅ ImportSession table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating ImportSession table:', error);
    return false;
  }
}

async function dropFileNameColumn() {
  try {
    console.log('🔄 Dropping fileName column from ImportSession table...');
    await prisma.$executeRaw`
      ALTER TABLE "ImportSession" DROP COLUMN IF EXISTS "fileName";
    `;
    console.log('✅ fileName column dropped successfully');
    return true;
  } catch (error) {
    console.error('❌ Error dropping fileName column:', error);
    return false;
  }
}

async function addFilePathColumn() {
  try {
    console.log('➕ Adding filePath column to ImportSession table...');
    await prisma.$executeRaw`
      ALTER TABLE "ImportSession" ADD COLUMN IF NOT EXISTS "filePath" TEXT;
    `;
    console.log('✅ filePath column added successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding filePath column:', error);
    return false;
  }
}

async function transferData() {
  try {
    // Check if both columns exist to perform data transfer
    const fileNameExists = await checkColumnExists('fileName');
    const filePathExists = await checkColumnExists('filePath');
    
    if (fileNameExists && filePathExists) {
      console.log('🔄 Transferring data from fileName to filePath column...');
      await prisma.$executeRaw`
        UPDATE "ImportSession" 
        SET "filePath" = "fileName" 
        WHERE "filePath" IS NULL AND "fileName" IS NOT NULL;
      `;
      console.log('✅ Data transferred successfully');
    }
    return true;
  } catch (error) {
    console.error('❌ Error transferring data:', error);
    return false;
  }
}

async function fixImportSessionTable() {
  console.log('🚀 Starting ImportSession table fix...');
  
  try {
    // Check if table exists
    const tableExists = await checkTableExists();
    
    if (!tableExists) {
      console.log('⚠️ ImportSession table does not exist');
      await createImportSessionTable();
      return;
    }
    
    console.log('✅ ImportSession table exists');
    
    // Check columns
    const fileNameExists = await checkColumnExists('fileName');
    const filePathExists = await checkColumnExists('filePath');
    
    console.log(`📊 Current schema status:
- fileName column: ${fileNameExists ? 'EXISTS ⚠️' : 'MISSING ✅'}
- filePath column: ${filePathExists ? 'EXISTS ✅' : 'MISSING ⚠️'}`);
    
    // Run fixes if needed
    if (fileNameExists && filePathExists) {
      // Both columns exist, transfer data first
      await transferData();
      await dropFileNameColumn();
    } else if (fileNameExists) {
      // Only fileName exists, add filePath then transfer
      await addFilePathColumn();
      await transferData();
      await dropFileNameColumn();
    } else if (!filePathExists) {
      // filePath is missing, add it
      await addFilePathColumn();
    } else {
      console.log('✅ Schema is already correct (filePath exists, fileName does not)');
    }
    
    // Verify final state
    const finalFileNameExists = await checkColumnExists('fileName');
    const finalFilePathExists = await checkColumnExists('filePath');
    
    console.log(`\n📊 Final schema status:
- fileName column: ${finalFileNameExists ? 'EXISTS ⚠️' : 'MISSING ✅'}
- filePath column: ${finalFilePathExists ? 'EXISTS ✅' : 'MISSING ⚠️'}`);
    
    if (!finalFileNameExists && finalFilePathExists) {
      console.log('✅ ImportSession table fix SUCCESSFUL');
    } else {
      console.log('⚠️ ImportSession table fix INCOMPLETE');
    }
  } catch (error) {
    console.error('💥 Unexpected error fixing ImportSession table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixImportSessionTable()
  .then(() => {
    console.log('🏁 ImportSession PostgreSQL fix script completed');
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 