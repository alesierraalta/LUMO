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
 * Fixes the ImportSession table schema in the database
 * Used to address the "column fileName of relation ImportSession does not exist" error
 */
export async function fixImportSessionSchema(): Promise<boolean> {
  try {
    console.log('🔧 Running ImportSession schema fix...');
    
    // Determine the environment and choose the appropriate fix script
    const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
    const scriptName = isProduction ? 'fix-import-session-postgres.js' : 'fix-import-session-sqlite.js';
    const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Schema fix script not found: ${scriptPath}`);
      return false;
    }
    
    // Run the fix script
    const result = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });
    console.log(result);
    
    return true;
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