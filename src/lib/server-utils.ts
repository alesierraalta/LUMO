/**
 * Server-side utilities
 * 
 * IMPORTANT: This file contains Node.js specific code and should NEVER be
 * imported directly by client components.
 */

import 'server-only';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fixes the ImportSession table schema in the database and verifies model access
 * Used to address the "column fileName of relation ImportSession does not exist" error
 */
export async function fixImportSessionSchema(): Promise<boolean> {
  try {
    // Generate unique ID for this fix attempt (for logging correlation)
    const fixId = `fix-${Date.now().toString(36)}`;
    console.log(`[${fixId}] 🔧 Running ImportSession schema fix...`);
    
    // Check current schema state before fix
    let schemaBefore;
    try {
      schemaBefore = await checkImportSessionSchema();
      console.log(`[${fixId}] 📊 Schema state before fix:`, JSON.stringify(schemaBefore, null, 2));
    } catch (checkError) {
      console.error(`[${fixId}] ❌ Error checking schema before fix:`, checkError);
    }
    
    // Determine the environment and choose the appropriate fix script
    const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
    const scriptName = isProduction ? 'fix-import-session-postgres.js' : 'fix-import-session-sqlite.js';
    const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`[${fixId}] ❌ Schema fix script not found: ${scriptPath}`);
      return false;
    }
    
    // Run the fix script
    console.log(`[${fixId}] 🚀 Executing schema fix script: ${scriptName}`);
    const result = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });
    console.log(`[${fixId}] 📋 Schema fix script output:`, result);
    
    // Check schema state after fix
    let schemaAfter;
    try {
      schemaAfter = await checkImportSessionSchema();
      console.log(`[${fixId}] 📊 Schema state after fix:`, JSON.stringify(schemaAfter, null, 2));
    } catch (checkError) {
      console.error(`[${fixId}] ❌ Error checking schema after fix:`, checkError);
      return false;
    }
    
    // Verify model access by attempting a simple operation
    console.log(`[${fixId}] 🔍 Verifying ImportSession model access...`);
    try {
      // Test ImportSession access with a count operation
      const count = await prisma.$queryRaw`SELECT COUNT(*) FROM "ImportSession"`;
      console.log(`[${fixId}] ✓ Successfully queried ImportSession table: ${JSON.stringify(count)}`);
      
      // Test model access via Prisma client
      let modelAccessOk = false;
      try {
        // Try using the Prisma model directly (will throw if model not accessible)
        const result = await prisma.importSession?.count();
        console.log(`[${fixId}] ✓ Verified Prisma model access: count = ${result}`);
        modelAccessOk = true;
      } catch (modelError) {
        console.error(`[${fixId}] ❌ Error accessing Prisma model:`, modelError);
        
        // If direct model access fails, try to detect if the client has the model
        const models = Object.keys(prisma).filter(key => 
          !key.startsWith('_') && 
          !key.startsWith('$') && 
          typeof prisma[key as keyof typeof prisma] === 'object'
        );
        console.log(`[${fixId}] 📋 Available Prisma models: ${models.join(', ')}`);
        
        // Check if ImportSession is in the list
        if (!models.includes('importSession')) {
          console.error(`[${fixId}] ❌ ImportSession model not found in Prisma client!`);
          
          // Try through prisma.prisma as a last resort
          try {
            // @ts-ignore - Using dynamic access for recovery
            const directResult = await (prisma as any).prisma?.importSession?.count();
            console.log(`[${fixId}] ✓ Verified access through prisma.prisma: count = ${directResult}`);
            modelAccessOk = true;
          } catch (directError) {
            console.error(`[${fixId}] ❌ Failed to access model through prisma.prisma:`, directError);
          }
        }
      }
      
      // Final verification of schema state and model access
      const schemaOk = schemaAfter?.hasTable && schemaAfter?.hasFilePathColumn && !schemaAfter?.hasFileNameColumn;
      
      if (schemaOk && modelAccessOk) {
        console.log(`[${fixId}] ✅ ImportSession schema fix and verification SUCCESSFUL`);
    return true;
      } else if (schemaOk) {
        console.warn(`[${fixId}] ⚠️ Schema structure OK but model access FAILED`);
        return false;
      } else {
        console.error(`[${fixId}] ❌ Schema fix FAILED - schema structure incorrect`);
        return false;
      }
    } catch (verifyError) {
      console.error(`[${fixId}] ❌ Error verifying schema fix:`, verifyError);
      return false;
    }
  } catch (error) {
    console.error('❌ Error fixing ImportSession schema:', error);
    return false;
  }
}

/**
 * Safely checks if the ImportSession schema needs fixing
 * Returns boolean instead of throwing errors
 */
export async function checkImportSessionSchema(): Promise<{
  needsFix: boolean;
  hasTable: boolean;
  hasFileNameColumn: boolean;
  hasFilePathColumn: boolean;
}> {
  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw<[{exists: boolean}]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession'
      );
    `;
    
    const hasTable = tableExists[0].exists;
    
    if (!hasTable) {
      return {
        needsFix: true,
        hasTable: false,
        hasFileNameColumn: false,
        hasFilePathColumn: false,
      };
    }
    
    // Check columns
    const fileNameExists = await prisma.$queryRaw<[{exists: boolean}]>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession' 
        AND column_name = 'fileName'
      );
    `;
    
    const filePathExists = await prisma.$queryRaw<[{exists: boolean}]>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ImportSession' 
        AND column_name = 'filePath'
      );
    `;
    
    const hasFileNameColumn = fileNameExists[0].exists;
    const hasFilePathColumn = filePathExists[0].exists;
    
    // Needs fix if fileName exists or filePath doesn't exist
    const needsFix = hasFileNameColumn || !hasFilePathColumn;
    
    return {
      needsFix,
      hasTable,
      hasFileNameColumn,
      hasFilePathColumn,
    };
  } catch (error) {
    console.error('Error checking ImportSession schema:', error);
    return {
      needsFix: true, // Assume needs fix on error
      hasTable: false,
      hasFileNameColumn: false,
      hasFilePathColumn: false,
    };
  }
}

/**
 * Creates directories required for import functionality
 */
export function ensureImportDirectories(): void {
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
  } catch (error) {
    console.error('❌ Error creating import directories:', error);
  }
} 