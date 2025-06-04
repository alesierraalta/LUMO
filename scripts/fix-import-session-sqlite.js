#!/usr/bin/env node

/**
 * ImportSession SQLite Schema Fix
 * 
 * This script fixes the ImportSession table schema in SQLite databases.
 * It's used in development environments to handle the fileName/filePath issue.
 */

console.log('🔧 ImportSession SQLite Schema Fix');
console.log('======================================');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableExists() {
  try {
    console.log('🔍 Checking if ImportSession table exists...');
    const result = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ImportSession';
    `;
    return result && result.length > 0;
  } catch (error) {
    console.error('❌ Error checking table existence:', error);
    return false;
  }
}

async function checkColumnExists(columnName) {
  try {
    console.log(`🔍 Checking if column '${columnName}' exists in ImportSession table...`);
    const result = await prisma.$queryRaw`
      PRAGMA table_info(ImportSession);
    `;
    return result && result.some(col => col.name === columnName);
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
        "id" TEXT NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "fileId" TEXT,
        "fileSize" INTEGER,
        "filePath" TEXT,
        "totalRows" INTEGER DEFAULT 0,
        "processedRows" INTEGER DEFAULT 0,
        "successRows" INTEGER DEFAULT 0,
        "errorRows" INTEGER DEFAULT 0,
        "metadata" TEXT
      );
    `;
    console.log('✅ ImportSession table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating ImportSession table:', error);
    return false;
  }
}

async function alterTableSchema() {
  try {
    // SQLite doesn't support ALTER TABLE DROP COLUMN directly
    // We need to create a new table, copy data, drop the old table, and rename the new one
    
    console.log('🔄 Creating new table structure...');
    await prisma.$executeRaw`
      CREATE TABLE "ImportSession_new" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "fileId" TEXT,
        "fileSize" INTEGER,
        "filePath" TEXT,
        "totalRows" INTEGER DEFAULT 0,
        "processedRows" INTEGER DEFAULT 0,
        "successRows" INTEGER DEFAULT 0,
        "errorRows" INTEGER DEFAULT 0,
        "metadata" TEXT
      );
    `;
    
    // Transfer data
    console.log('🔄 Transferring data to new table structure...');
    const hasFileNameColumn = await checkColumnExists('fileName');
    
    if (hasFileNameColumn) {
      console.log('🔄 Copying data with fileName to filePath...');
      await prisma.$executeRaw`
        INSERT INTO "ImportSession_new" (
          id, createdAt, updatedAt, userId, status, fileId, fileSize, filePath, 
          totalRows, processedRows, successRows, errorRows, metadata
        )
        SELECT 
          id, 
          createdAt, 
          COALESCE(updatedAt, createdAt) as updatedAt, 
          COALESCE(userId, createdById) as userId, 
          status, 
          fileId,
          fileSize,
          COALESCE(filePath, fileName) as filePath,
          COALESCE(totalRows, totalItems, 0) as totalRows, 
          COALESCE(processedRows, 0) as processedRows, 
          COALESCE(successRows, successItems, 0) as successRows, 
          COALESCE(errorRows, errorItems, 0) as errorRows, 
          metadata
        FROM "ImportSession";
      `;
    } else {
      console.log('🔄 Copying data with existing schema...');
      await prisma.$executeRaw`
        INSERT INTO "ImportSession_new" (
          id, createdAt, updatedAt, userId, status, fileId, fileSize, filePath, 
          totalRows, processedRows, successRows, errorRows, metadata
        )
        SELECT 
          id, 
          createdAt, 
          COALESCE(updatedAt, createdAt) as updatedAt, 
          COALESCE(userId, createdById) as userId, 
          status, 
          fileId,
          fileSize,
          filePath,
          COALESCE(totalRows, totalItems, 0) as totalRows, 
          COALESCE(processedRows, 0) as processedRows, 
          COALESCE(successRows, successItems, 0) as successRows, 
          COALESCE(errorRows, errorItems, 0) as errorRows, 
          metadata
        FROM "ImportSession";
      `;
    }
    
    // Drop old table
    console.log('🔄 Dropping old ImportSession table...');
    await prisma.$executeRaw`DROP TABLE "ImportSession";`;
    
    // Rename new table
    console.log('🔄 Renaming new table to ImportSession...');
    await prisma.$executeRaw`ALTER TABLE "ImportSession_new" RENAME TO "ImportSession";`;
    
    console.log('✅ ImportSession table structure updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error altering ImportSession table:', error);
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
    if (fileNameExists || !filePathExists) {
      await alterTableSchema();
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
    console.log('🏁 ImportSession SQLite fix script completed');
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 