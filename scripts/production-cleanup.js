#!/usr/bin/env node

/**
 * LUMO Production Cleanup Script
 * Removes debug endpoints, test files, and development-only code
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LUMO Production Cleanup Starting...\n');

// Debug endpoints to remove
const debugEndpoints = [
  'src/app/api/debug-env',
  'src/app/api/debug-roles', 
  'src/app/api/debug-production',
  'src/app/api/test-service-client',
  'src/app/api/users/create-temp',
  'src/app/api/test-performance',
  'src/app/api/cache-stats',
  'src/app/api/error-report'
];

// Test scripts to organize
const testScripts = [
  'scripts/comprehensive-crud-test-improved.js',
  'scripts/final-comprehensive-test.js',
  'scripts/test-role-management-complete.js',
  'scripts/test-role-management-complete-fixed.js',
  'scripts/test-user-creation-debug.js',
  'scripts/comprehensive-frontend-test.js',
  'scripts/ensure-basic-roles.js',
  'scripts/test-service-client.js',
  'scripts/final-database-cleanup.js',
  'scripts/emergency-debug-cleanup.js',
  'scripts/quick-api-check.js'
];

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`❌ Removed: ${dirPath}`);
    return true;
  }
  return false;
}

function createDevToolsDirectory() {
  const devToolsDir = 'dev-tools';
  if (!fs.existsSync(devToolsDir)) {
    fs.mkdirSync(devToolsDir, { recursive: true });
    console.log(`📁 Created: ${devToolsDir}/`);
  }
  
  const scriptsDir = path.join(devToolsDir, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log(`📁 Created: ${scriptsDir}/`);
  }
}

function moveTestScript(scriptPath) {
  if (fs.existsSync(scriptPath)) {
    const fileName = path.basename(scriptPath);
    const newPath = path.join('dev-tools', 'scripts', fileName);
    
    fs.renameSync(scriptPath, newPath);
    console.log(`📦 Moved: ${scriptPath} → ${newPath}`);
    return true;
  }
  return false;
}

function cleanupDebugEndpoints() {
  console.log('🔧 Removing debug endpoints...');
  let removedCount = 0;
  
  debugEndpoints.forEach(endpoint => {
    if (removeDirectory(endpoint)) {
      removedCount++;
    }
  });
  
  console.log(`✅ Removed ${removedCount} debug endpoints\n`);
}

function organizeTestScripts() {
  console.log('📦 Organizing test scripts...');
  createDevToolsDirectory();
  
  let movedCount = 0;
  testScripts.forEach(script => {
    if (moveTestScript(script)) {
      movedCount++;
    }
  });
  
  console.log(`✅ Moved ${movedCount} test scripts to dev-tools/\n`);
}

function createProductionReadme() {
  const readmeContent = `# LUMO Inventory Management System

## Production Build

This is the production-ready version of LUMO with all debug endpoints and test code removed.

### Core Features
- ✅ Complete CRUD operations for inventory, categories, locations
- ✅ Supabase authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Optimized for production deployment

### API Endpoints (Production)
- \`/api/auth/*\` - Authentication endpoints
- \`/api/inventory/*\` - Inventory management
- \`/api/categories/*\` - Category management  
- \`/api/locations/*\` - Location management
- \`/api/users/*\` - User management
- \`/api/roles/*\` - Role management
- \`/api/permissions/*\` - Permission management
- \`/api/health\` - Health check

### Development Tools
All test scripts and debug utilities have been moved to \`dev-tools/\` directory.

### Deployment
\`\`\`bash
npm run build
npm run start
\`\`\`

### Environment Variables Required
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`NODE_ENV=production\`
`;

  fs.writeFileSync('README-PRODUCTION.md', readmeContent);
  console.log('📄 Created: README-PRODUCTION.md');
}

function updatePackageJson() {
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add production scripts if not present
    if (!packageJson.scripts.build) {
      packageJson.scripts.build = 'next build';
    }
    if (!packageJson.scripts.start) {
      packageJson.scripts.start = 'next start';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('📦 Updated: package.json with production scripts');
  }
}

// Main execution
async function main() {
  try {
    cleanupDebugEndpoints();
    organizeTestScripts();
    createProductionReadme();
    updatePackageJson();
    
    console.log('🎉 Production cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Debug endpoints removed');
    console.log('   • Test scripts organized in dev-tools/');
    console.log('   • Production README created');
    console.log('   • Package.json updated');
    console.log('\n🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();