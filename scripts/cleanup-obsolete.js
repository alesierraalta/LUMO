#!/usr/bin/env node

/**
 * Cleanup Obsolete Files and Dependencies
 * This script helps identify files that can be removed
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up obsolete files and dependencies...\n');

// Files/patterns to check for removal
const obsoletePatterns = [
  // Clerk related
  'CLERK_*',
  'clerk*',
  'Clerk*',
  
  // Neon related  
  'NEON_*',
  'neon*',
  'Neon*',
  
  // Old Prisma scripts
  'ensure-prisma-*',
  'prisma-*',
  
  // Choreo debug files
  'CHOREO_*',
  'choreo-*'
];

// Environment variables to remove from Choreo
const obsoleteEnvVars = [
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY', 
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_JWT_KEY',
  'NEON_DATABASE_URL',
  'NEON_API_KEY',
  'PRISMA_CLIENT_ENGINE_TYPE',
  'PRISMA_CLI_BINARY_TARGETS'
];

console.log('📋 Files/Patterns to Review for Removal:');
obsoletePatterns.forEach(pattern => {
  console.log(`   - ${pattern}`);
});

console.log('\n🔧 Environment Variables to Remove from Choreo:');
obsoleteEnvVars.forEach(envVar => {
  console.log(`   - ${envVar}`);
});

// Check package.json for obsolete dependencies
console.log('\n📦 Checking package.json for obsolete dependencies...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const obsoleteDeps = [
    '@clerk/nextjs',
    '@clerk/clerk-react',
    '@clerk/types',
    '@neon/drizzle',
    '@planetscale/database',
    'drizzle-orm',
    'drizzle-kit'
  ];
  
  const foundObsolete = [];
  
  // Check dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (obsoleteDeps.some(obs => dep.includes(obs.split('/')[1] || obs))) {
        foundObsolete.push(`dependencies.${dep}`);
      }
    });
  }
  
  // Check devDependencies
  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => {
      if (obsoleteDeps.some(obs => dep.includes(obs.split('/')[1] || obs))) {
        foundObsolete.push(`devDependencies.${dep}`);
      }
    });
  }
  
  if (foundObsolete.length > 0) {
    console.log('⚠️ Found obsolete dependencies:');
    foundObsolete.forEach(dep => {
      console.log(`   - ${dep}`);
    });
    console.log('\n💡 Run: npm uninstall <package_name> to remove them');
  } else {
    console.log('✅ No obsolete dependencies found');
  }
  
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Check for Clerk imports in code
console.log('\n🔍 Checking for Clerk imports in TypeScript/JavaScript files...');

function findClerkImports(dir) {
  const files = fs.readdirSync(dir);
  const clerkFiles = [];
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      clerkFiles.push(...findClerkImports(fullPath));
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('@clerk') || content.includes('useUser') || content.includes('SignIn') || content.includes('SignUp')) {
          clerkFiles.push(fullPath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  return clerkFiles;
}

try {
  const clerkFiles = findClerkImports('src');
  
  if (clerkFiles.length > 0) {
    console.log('⚠️ Found files with potential Clerk references:');
    clerkFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('\n💡 Review these files and remove Clerk imports');
  } else {
    console.log('✅ No Clerk imports found');
  }
} catch (error) {
  console.log('⚠️ Could not scan for Clerk imports');
}

console.log('\n🎯 Summary:');
console.log('1. Review and remove obsolete files listed above');
console.log('2. Remove obsolete environment variables from Choreo');
console.log('3. Clean up any Clerk imports in your code');
console.log('4. Test that everything works with the hybrid SQLite/Supabase setup');
console.log('\n✅ Cleanup guide complete!'); 