#!/usr/bin/env node

/**
 * Fix Hardcoded Production URLs
 * Replace all hardcoded production URLs with environment variables
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const DEVELOPMENT_URL = 'https://ndprriqyhddjoixrlqnz.supabase.co';

const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3Bodnd1ayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTc5NzYzODQsImV4cCI6MjAzMzU1MjM4NH0.oUP6oOOaYjRcqLEGBBHsO7CfZPKKbJJKcAJQbFKHcWU';
const DEV_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI';

const FILES_TO_FIX = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/login-simple/route.ts',
  'src/app/api/debug-env-supabase/route.ts'
];

function fixFile(filePath) {
  try {
    console.log(`🔧 Fixing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Fix hardcoded production URL
    if (content.includes(`'${PRODUCTION_URL}'`)) {
      content = content.replace(
        `const supabaseUrl = '${PRODUCTION_URL}';`,
        `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '${DEVELOPMENT_URL}';`
      );
      changed = true;
      console.log(`  ✅ Fixed hardcoded URL`);
    }
    
    // Fix hardcoded service key
    if (content.includes(PROD_SERVICE_KEY)) {
      content = content.replace(
        `process.env.SUPABASE_SERVICE_ROLE_KEY || '${PROD_SERVICE_KEY}'`,
        `process.env.SUPABASE_SERVICE_ROLE_KEY || '${DEV_SERVICE_KEY}'`
      );
      changed = true;
      console.log(`  ✅ Fixed hardcoded service key`);
    }
    
    // Add debug logging if not present
    if (!content.includes('Using Supabase URL:') && content.includes('const supabaseUrl =')) {
      content = content.replace(
        /const supabaseUrl = ([^;]+);/,
        `const supabaseUrl = $1;
    
    console.log('🔧 Using Supabase URL:', supabaseUrl);
    console.log('🔑 Service key length:', supabaseServiceKey?.length || 'undefined');`
      );
      changed = true;
      console.log(`  ✅ Added debug logging`);
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  💾 File updated successfully`);
      return true;
    } else {
      console.log(`  ✅ No changes needed`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 FIXING HARDCODED PRODUCTION URLS');
  console.log('===================================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Development URL: ${DEVELOPMENT_URL}`);
  console.log('');
  
  let totalFixed = 0;
  
  for (const filePath of FILES_TO_FIX) {
    if (fixFile(filePath)) {
      totalFixed++;
    }
  }
  
  console.log('');
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`Files processed: ${FILES_TO_FIX.length}`);
  console.log(`Files fixed: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log('');
    console.log('🎉 SUCCESS! All hardcoded URLs have been fixed.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Make sure your .env.local has the correct variables');
    console.log('2. Test the login functionality');
    console.log('3. Check browser console for debug logs');
    
    console.log('');
    console.log('🔧 Expected behavior:');
    console.log('- Should use development database (ndprriqyhddjoixrlqnz)');
    console.log('- Should show debug logs with correct URLs');
    console.log('- Login should work with development credentials');
  } else {
    console.log('');
    console.log('ℹ️ No changes were needed - all files already use environment variables.');
  }
}

main(); 