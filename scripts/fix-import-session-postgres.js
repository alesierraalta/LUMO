#!/usr/bin/env node

/**
 * Fix ImportSession Schema for PostgreSQL
 * 
 * This script ensures the ImportSession table in PostgreSQL has the correct structure.
 * It checks for the presence of required columns and adds them if they're missing.
 */

const { PrismaClient } = require('@prisma/client');

// Create Prisma client
const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
});

// Log with timestamps
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Check if table exists
async function tableExists() {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession'
      );
    `;
    return result[0].exists;
  } catch (error) {
    log('ERROR', 'Failed to check if table exists:', error);
    return false;
  }
}

// Get table columns
async function getTableColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ImportSession'
    `;
    return columns;
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
          "id" TEXT NOT NULL,
          "filePath" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3),
          
          CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
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

// Fix column issues
async function fixColumns() {
  try {
    const columns = await getTableColumns();
    const columnMap = columns.reduce((acc, col) => {
      acc[col.column_name] = col;
      return acc;
    }, {});
    
    const changes = [];
    
    // Check for filePath column
    if (!columnMap.filePath) {
      if (columnMap.fileName) {
        // Rename fileName to filePath if it exists
        log('INFO', 'Renaming fileName column to filePath');
        await prisma.$executeRaw`
          ALTER TABLE "ImportSession" 
          RENAME COLUMN "fileName" TO "filePath";
        `;
        changes.push('Renamed fileName to filePath');
      } else {
        // Add filePath column
        log('INFO', 'Adding filePath column');
        await prisma.$executeRaw`
          ALTER TABLE "ImportSession" 
          ADD COLUMN "filePath" TEXT NOT NULL DEFAULT '';
        `;
        changes.push('Added filePath column');
      }
    }
    
    // Check for createdById/userId
    if (!columnMap.createdById && !columnMap.userId) {
      log('INFO', 'Adding createdById column');
      await prisma.$executeRaw`
        ALTER TABLE "ImportSession" 
        ADD COLUMN "createdById" TEXT NOT NULL DEFAULT '';
      `;
      changes.push('Added createdById column');
    } else if (columnMap.userId && !columnMap.createdById) {
      // userId exists but createdById doesn't - keep as is, handled by code adapter
      log('INFO', 'userId column exists instead of createdById, this is handled by code adapter');
      changes.push('Noted userId instead of createdById (compatible)');
    }
    
    // Check for status column
    if (!columnMap.status) {
      log('INFO', 'Adding status column');
      await prisma.$executeRaw`
        ALTER TABLE "ImportSession" 
        ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
      `;
      changes.push('Added status column');
    }
    
    // Check for createdAt column
    if (!columnMap.createdAt) {
      log('INFO', 'Adding createdAt column');
      await prisma.$executeRaw`
        ALTER TABLE "ImportSession" 
        ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `;
      changes.push('Added createdAt column');
    }
    
    // Add updatedAt if missing
    if (!columnMap.updatedAt) {
      log('INFO', 'Adding updatedAt column');
      await prisma.$executeRaw`
        ALTER TABLE "ImportSession" 
        ADD COLUMN "updatedAt" TIMESTAMP(3);
      `;
      changes.push('Added updatedAt column');
    }
    
    if (changes.length === 0) {
      log('INFO', 'Schema is already correct, no changes needed');
    } else {
      log('INFO', `Made ${changes.length} changes to schema:`, changes);
    }
    
    return changes;
  } catch (error) {
    log('ERROR', 'Failed to fix columns:', error);
    throw error;
  }
}

// Update default values
async function updateDefaultValues() {
  try {
    // Set non-empty defaults for required fields
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "status" = 'PENDING' 
      WHERE "status" = '';
    `;

    // Set current timestamp for createdAt where NULL or empty
    await prisma.$executeRaw`
      UPDATE "ImportSession" 
      SET "createdAt" = CURRENT_TIMESTAMP 
      WHERE "createdAt" IS NULL;
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
    log('ERROR', 'Failed to access importSession model:', error.message);
    return false;
  }
}

// Main function
async function main() {
  log('INFO', '🚀 Starting ImportSession schema fix for PostgreSQL');
  
  try {
    // Connect to the database
    await prisma.$connect();
    
    let tableCreated = false;
    
    // Create table if it doesn't exist
    if (!await tableExists()) {
      tableCreated = await createTableIfNeeded();
    }
    
    if (!tableCreated) {
      // Fix columns if table already existed
      await fixColumns();
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