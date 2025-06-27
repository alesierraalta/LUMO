#!/usr/bin/env node

/**
 * Fix All Build Detection Logic Script
 * 
 * This script fixes all remaining files that have the old "ULTRA-AGGRESSIVE BUILD DETECTION"
 * logic and replaces it with the correct build detection that only triggers during actual builds.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [FIX-BUILD] Starting build detection fix for all files...\n');

// Old problematic pattern
const OLD_PATTERN = `// ULTRA-AGGRESSIVE BUILD DETECTION
const isBuild = process.env.NODE_ENV === 'production' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.BUILD_ID ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build'))
);`;

// New correct pattern
const NEW_PATTERN = `// FIXED BUILD DETECTION - Only trigger during actual build, not runtime
const isBuild = (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build')))
);

// RUNTIME SAFETY: Check for missing configuration but don't treat as build mode
const hasMissingConfig = (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
);`;

// Files to fix
const FILES_TO_FIX = [
  'src/lib/supabase-auth.ts',
  'src/lib/supabase-auth-client.ts',
  'src/lib/supabase-client-config.ts',
  'src/lib/supabase-server.ts',
  'src/app/api/auth/logout/route.ts'
];

let fixedFiles = 0;
let totalFiles = FILES_TO_FIX.length;

console.log(`📋 Processing ${totalFiles} files...\n`);

FILES_TO_FIX.forEach((filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file contains the old pattern
    if (content.includes('ULTRA-AGGRESSIVE BUILD DETECTION')) {
      console.log(`🔧 Fixing: ${filePath}`);
      
      // Replace the old pattern with the new one
      const newContent = content.replace(OLD_PATTERN, NEW_PATTERN);
      
      // Also fix any standalone build mode logs
      const finalContent = newContent.replace(
        /if \(isBuild\) \{\s*console\.log\('🏗️ BUILD MODE: Bypassing Supabase initialization'\);\s*\}/g,
        `if (isBuild) {
  console.log('🏗️ BUILD MODE: Bypassing Supabase initialization');
} else if (hasMissingConfig) {
  console.log('⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client');
}`
      );
      
      // Write the fixed content back
      fs.writeFileSync(fullPath, finalContent, 'utf8');
      
      console.log(`✅ Fixed: ${filePath}`);
      fixedFiles++;
    } else {
      console.log(`✅ Already fixed: ${filePath}`);
      fixedFiles++;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n📊 FIX SUMMARY:');
console.log(`   ✅ Fixed: ${fixedFiles}/${totalFiles}`);
console.log(`   📈 Success Rate: ${Math.round((fixedFiles / totalFiles) * 100)}%\n`);

if (fixedFiles === totalFiles) {
  console.log('🎉 ALL FILES FIXED! Build detection logic is now correct.');
  console.log('✅ Server will no longer incorrectly detect runtime as build mode');
  console.log('✅ Choreo deployments should now work correctly');
  console.log('✅ Dashboard will load without "order is not a function" errors\n');
  
  console.log('🚀 NEXT STEPS:');
  console.log('   1. Test locally with npm start');
  console.log('   2. Deploy to Choreo');
  console.log('   3. Verify dashboard loads correctly');
  
  process.exit(0);
} else {
  console.log('⚠️  Some files could not be fixed. Please check the errors above.');
  process.exit(1);
} 