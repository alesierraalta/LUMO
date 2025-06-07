#!/usr/bin/env node

/**
 * FIX PRISMA USAGE - Fix all instances of prisma.prisma pattern
 * 
 * This script finds and fixes all incorrect usage of prisma.prisma 
 * throughout the codebase, replacing them with just prisma.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 FIXING PRISMA USAGE PATTERNS');
console.log('==============================');

// Files to fix based on grep search results
const filesToFix = [
  'scripts/verify-import-session-fix.js',
  'src/lib/importService.ts',
  'src/lib/auth/auth-options.ts',
  'src/app/api/inventory/merge-duplicates.disabled/route.ts',
  'src/app/api/inventory/scan-duplicates.disabled/route.ts',
  'src/app/api/inventory/import/commit/route.ts',
  'src/app/api/inventory/import/process/route.ts',
  'src/app/api/inventory/import/history/route.ts',
  'src/app/api/inventory/import/history/[id]/route.ts',
  'src/app/api/products/search/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/health/excel-importer/route.ts',
  'src/app/api/choreo-migrate/route.ts',
  'src/lib/auth/permissions.ts'
];

let totalFilesFixed = 0;
let totalReplacements = 0;

console.log(`📁 Found ${filesToFix.length} files to fix\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Skipping ${filePath} (file not found)`);
    continue;
  }

  try {
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Count occurrences before replacement
    const matches = content.match(/prisma\.prisma\./g);
    const replacementCount = matches ? matches.length : 0;
    
    if (replacementCount === 0) {
      console.log(`✅ ${filePath} - No issues found`);
      continue;
    }
    
    // Replace all instances of prisma.prisma. with prisma.
    content = content.replace(/prisma\.prisma\./g, 'prisma.');
    
    // Write back the file
    fs.writeFileSync(fullPath, content);
    
    console.log(`🔄 ${filePath} - Fixed ${replacementCount} instances`);
    totalFilesFixed++;
    totalReplacements += replacementCount;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('\n📊 SUMMARY');
console.log('-----------');
console.log(`Files processed: ${filesToFix.length}`);
console.log(`Files fixed: ${totalFilesFixed}`);
console.log(`Total replacements: ${totalReplacements}`);

if (totalReplacements > 0) {
  console.log('\n🎉 PRISMA USAGE PATTERNS FIXED SUCCESSFULLY!');
  console.log('All instances of prisma.prisma have been corrected to prisma');
  console.log('\n🚀 Next steps:');
  console.log('1. Test the application to ensure everything works correctly');
  console.log('2. Run npm run dev to check for any remaining errors');
  console.log('3. Commit these changes when verified');
} else {
  console.log('\n✅ No issues found to fix');
} 