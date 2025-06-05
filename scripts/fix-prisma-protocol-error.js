#!/usr/bin/env node

/**
 * Fix Prisma Protocol Error Script
 * Comprehensive fix for P6001 "the URL must start with the protocol `prisma://`" error
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma Protocol Error (P6001)...');

// Files that might have problematic PrismaClient configurations
const filesToCheck = [
  'scripts/runtime-env-check.js',
  'scripts/verify-database-connection.js',
  'scripts/choreo-preflight.js',
  'scripts/validate-prisma-config.js',
  'src/lib/prisma.ts',
  'src/lib/auth.ts'
];

let fixesApplied = 0;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️ Skipping ${filePath} (file not found)`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Remove explicit datasourceUrl configurations
    const patterns = [
      {
        search: /datasourceUrl:\s*[^,}]+[,}]/g,
        replace: '// datasourceUrl removed to use schema.prisma configuration'
      },
      {
        search: /,\s*datasourceUrl:\s*[^,}]+/g,
        replace: ''
      }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
        console.log(`✅ Fixed datasourceUrl in ${filePath}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      fixesApplied++;
    } else {
      console.log(`✅ ${filePath} already correct`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

// Verify Prisma schema configuration
console.log('\n🔍 Verifying Prisma schema configuration...');

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for proper datasource configuration
  if (schemaContent.includes('provider = "postgresql"')) {
    console.log('✅ Prisma schema uses PostgreSQL provider');
  } else if (schemaContent.includes('provider = "sqlite"')) {
    console.log('✅ Prisma schema uses SQLite provider');
  } else {
    console.warn('⚠️ Unknown database provider in schema');
  }
  
  // Check for environment variable usage
  if (schemaContent.includes('env("DATABASE_URL")')) {
    console.log('✅ Prisma schema uses DATABASE_URL environment variable');
  } else {
    console.warn('⚠️ Prisma schema does not use DATABASE_URL environment variable');
  }
} else {
  console.error('❌ Prisma schema file not found');
}

// Check environment variable format
console.log('\n🔍 Checking DATABASE_URL format...');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL environment variable not set');
} else {
  console.log(`📋 DATABASE_URL pattern: ${databaseUrl.substring(0, 30)}...`);
  
  if (databaseUrl.startsWith('prisma://')) {
    console.log('✅ Using Prisma Accelerate/Data Platform URL');
  } else if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    console.log('✅ Using standard PostgreSQL URL');
    
    if (databaseUrl.startsWith('postgres://')) {
      console.log('🔧 Note: postgres:// will be auto-converted to postgresql://');
    }
  } else {
    console.warn('⚠️ Unknown DATABASE_URL format');
  }
}

// Generate rebuild instructions
console.log('\n📋 Fix Summary:');
console.log(`✅ Files processed: ${filesToCheck.length}`);
console.log(`🔧 Fixes applied: ${fixesApplied}`);

if (fixesApplied > 0) {
  console.log('\n🚀 Next Steps:');
  console.log('1. Rebuild the application: npm run build');
  console.log('2. Restart the server');
  console.log('3. Test login functionality');
  console.log('\n💡 If the error persists:');
  console.log('- Check for any cached .next build files');
  console.log('- Verify all PrismaClient instances use schema.prisma configuration');
  console.log('- Ensure DATABASE_URL format is correct for your database provider');
} else {
  console.log('\n✅ No fixes needed - configuration appears correct');
  console.log('\n💡 If you\'re still experiencing P6001 errors:');
  console.log('1. Clear .next build cache: rm -rf .next');
  console.log('2. Rebuild: npm run build');
  console.log('3. Check for any custom PrismaClient instantiations');
}

console.log('\n🎯 Prisma Protocol Error Fix Complete!'); 