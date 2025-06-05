#!/usr/bin/env node

/**
 * Fix ImportSession Schema for SQLite
 * 
 * This script ensures the ImportSession table in SQLite has the correct structure.
 * It checks for the presence of required columns and adds them if they're missing.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Create Prisma client
const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
});

// Log with timestamps
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Helper to check database file access
function checkDatabaseFileAccess() {
  try {
    const url = process.env.DATABASE_URL || '';
    if (!url || !url.includes('file:')) {
      log('WARN', 'Database URL does not appear to be a SQLite file URL');
      return true; // Continue anyway
    }
    
    // Extract file path from SQLite URL
    const filePath = url.replace(/^file:/i, '').split('?')[0];
    
    if (!fs.existsSync(filePath)) {
      log('ERROR', `SQLite database file not found: ${filePath}`);
      return false;
    }
    
    // Try accessing the file
    try {
      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
      log('INFO', `SQLite database file is accessible: ${filePath}`);
      return true;
    } catch (e) {
      log('ERROR', `SQLite database file access error: ${e.message}`);
      return false;
    }
  } catch (err) {
    log('ERROR', 'Error checking database file access:', err);
    return false;
  }
}

// Check if table exists
async function tableExists() {
  try {
    const result = await prisma.$queryRaw`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ImportSession';
    `;
    return result.length > 0;
  } catch (error) {
    log('ERROR', 'Failed to check if table exists:', error);
    return false;
  }
}

// Get table columns
async function getTableColumns() {
  try {
    const columns = await prisma.$queryRaw`PRAGMA table_info("ImportSession");`;
    return columns.map(col => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull,
      dflt_value: col.dflt_value
    }));
  } catch (error) {
    log('ERROR', 'Failed to get table columns:', error);
    return [];
  }
}

// Create table if it doesn't exist
async function createTableIfNeeded() {
  try {
    const exists = await tableExists();
    
    if (!exists) {
      log('INFO', 'Creating ImportSession table');
      
      await prisma.$executeRaw`
        CREATE TABLE "ImportSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "filePath" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME
        );
      `;
      
      log('INFO', 'ImportSession table created successfully');
      return true;
    }
    
    log('INFO', 'ImportSession table already exists');
    return false;
  } catch (error) {
    log('ERROR', 'Failed to create table:', error);
    throw error;
  }
}

// Helper to create a temporary table and copy data
async function recreateTableWithCorrectSchema(currentColumns) {
  try {
    log('INFO', 'Creating temporary table with correct schema');
    
    // Create temp table with correct schema
    await prisma.$executeRaw`
      CREATE TABLE "ImportSession_temp" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "filePath" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "createdById" TEXT NOT NULL, 
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME
      );
    `;
    
    // Build column list for existing data
    const columnsToCopy = [];
    const currentColumnNames = currentColumns.map(c => c.name);
    
    // Map old column names to new names
    const mappings = {
      'id': 'id',
      'fileName': 'filePath', 
      'filePath': 'filePath',
      'userId': 'createdById',
      'createdById': 'createdById',
      'status': 'status',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    // Identify which columns can be copied
    for (const [oldCol, newCol] of Object.entries(mappings)) {
      if (currentColumnNames.includes(oldCol)) {
        columnsToCopy.push({
          oldName: oldCol,
          newName: newCol
        });
      }
    }
    
    // Log what we're going to copy
    log('INFO', `Will copy these columns: ${columnsToCopy.map(c => `${c.oldName} -> ${c.newName}`).join(', ')}`);
    
    // Prepare INSERT statement
    const oldColumns = columnsToCopy.map(c => `"${c.oldName}"`).join(', ');
    const newColumns = columnsToCopy.map(c => `"${c.newName}"`).join(', ');
    
    // Only attempt copy if we have columns to copy
    if (columnsToCopy.length > 0) {
      log('INFO', 'Copying data to temporary table');
      
      // Use raw SQL to copy data
      await prisma.$executeRaw`
        INSERT INTO "ImportSession_temp"(${newColumns})
        SELECT ${oldColumns} FROM "ImportSession";
      `;
      
      log('INFO', 'Data copied successfully');
    }
    
    // Drop original table
    log('INFO', 'Dropping original table');
    await prisma.$executeRaw`DROP TABLE "ImportSession";`;
    
    // Rename temp table
    log('INFO', 'Renaming temporary table to ImportSession');
    await prisma.$executeRaw`ALTER TABLE "ImportSession_temp" RENAME TO "ImportSession";`;
    
    log('INFO', 'Table recreation completed successfully');
    return true;
  } catch (error) {
    log('ERROR', 'Failed to recreate table:', error);
    throw error;
  }
}

// Fix column issues in SQLite
async function fixSchema() {
  try {
    const columns = await getTableColumns();
    log('INFO', `Current table has ${columns.length} columns`);
    
    if (columns.length === 0) {
      log('ERROR', 'Failed to get column information');
      return false;
    }
    
    // Map column names for easier access
    const columnMap = columns.reduce((acc, col) => {
      acc[col.name] = col;
      return acc;
    }, {});
    
    // Check for required columns
    const requiredColumns = ['id', 'status', 'createdAt'];
    const missingRequired = requiredColumns.filter(col => !columnMap[col]);
    
    // Check for filePath (or fileName which would need migration)
    const hasFilePath = !!columnMap.filePath;
    const hasFileName = !!columnMap.fileName;
    
    // Check for createdById vs userId
    const hasCreatedById = !!columnMap.createdById;
    const hasUserId = !!columnMap.userId;
    
    // Decide if we need schema fixes
    const needsSchemaFix = missingRequired.length > 0 || 
                           (!hasFilePath && !hasFileName) ||
                           (!hasCreatedById && !hasUserId);
                          
    if (needsSchemaFix) {
      log('INFO', 'Schema needs fixing, recreating table with correct structure');
      const result = await recreateTableWithCorrectSchema(columns);
      return result;
    } else if (hasFileName && !hasFilePath) {
      log('INFO', 'Need to rename fileName to filePath');
      // In SQLite, we need to recreate the table to rename a column
      const result = await recreateTableWithCorrectSchema(columns);
      return result;
    } else {
      log('INFO', 'Schema is already correct, no changes needed');
      return true;
    }
  } catch (error) {
    log('ERROR', 'Failed to fix schema:', error);
    return false;
  }
}

// Update default values
async function updateDefaultValues() {
  try {
    // Set non-empty defaults for required fields
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "status" = 'PENDING' 
      WHERE "status" = '' OR "status" IS NULL;
    `;
    
    // Set current timestamp for createdAt where NULL or empty
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "createdAt" = CURRENT_TIMESTAMP 
      WHERE "createdAt" IS NULL;
    `;
    
    // Ensure non-empty filePath
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "filePath" = 'unknown-file' 
      WHERE "filePath" = '' OR "filePath" IS NULL;
    `;
    
    // Ensure non-empty createdById
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "createdById" = 'unknown-user' 
      WHERE "createdById" = '' OR "createdById" IS NULL;
    `;
    
    log('INFO', 'Default values updated');
    return true;
  } catch (error) {
    log('ERROR', 'Failed to update default values:', error);
    return false;
  }
}

// Test model access
async function testModelAccess() {
  try {
    log('INFO', 'Testing model access...');
    const count = await prisma.importSession.count();
    log('INFO', `ImportSession model is accessible, found ${count} records`);
    return true;
  } catch (error) {
    log('ERROR', 'Failed to access importSession model:', error);
    return false;
  }
}

// Main function
async function main() {
  log('INFO', '🚀 Starting ImportSession schema fix for SQLite');
  
  try {
    // Check database file access first
    if (!checkDatabaseFileAccess()) {
      log('ERROR', 'Cannot access database file, aborting');
      process.exit(1);
    }
    
    // Connect to the database
    await prisma.$connect();
    
    let tableCreated = false;
    
    // Create table if it doesn't exist
    if (!await tableExists()) {
      tableCreated = await createTableIfNeeded();
    }
    
    if (!tableCreated) {
      // Fix schema if table already existed
      await fixSchema();
    }
    
    // Update default values
    await updateDefaultValues();
    
    // Test if model is accessible
    const modelAccessible = await testModelAccess();
    if (!modelAccessible) {
      log('WARN', 'ImportSession model is not accessible via Prisma client.');
      log('WARN', 'You may need to restart the application or regenerate Prisma client.');
    }
    
    log('INFO', '✅ ImportSession schema fix completed');
  } catch (error) {
    log('ERROR', '❌ Failed to fix ImportSession schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main(); 