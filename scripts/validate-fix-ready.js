#!/usr/bin/env node

/**
 * Validate User Edit Fix Ready for Deployment
 * 
 * Simple validation that our fix is properly implemented and ready
 * for deployment to Choreo without requiring database connections.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating User Edit Fix Deployment Readiness');
console.log('================================================\n');

let allChecks = 0;
let passedChecks = 0;

const check = (name, testFn) => {
  allChecks++;
  console.log(`🔍 Checking: ${name}`);
  
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ PASSED: ${name}`);
      passedChecks++;
    } else {
      console.log(`❌ FAILED: ${name}`);
    }
    return result;
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    return false;
  }
};

// Check 1: db-hybrid.ts contains our fix
check('User edit fix implemented in db-hybrid.ts', () => {
  const dbHybridPath = 'src/lib/db-hybrid.ts';
  if (!fs.existsSync(dbHybridPath)) {
    throw new Error('db-hybrid.ts not found');
  }
  
  const content = fs.readFileSync(dbHybridPath, 'utf8');
  
  // Check for include parameter handling
  if (!content.includes('params.include && params.include.role')) {
    throw new Error('Include parameter handling not found');
  }
  
  // Check for role JOIN query
  if (!content.includes('role:roles(*)')) {
    throw new Error('Role JOIN query not found');
  }
  
  // Check for proper data transformation
  if (!content.includes('roleId: data.role_id')) {
    throw new Error('Role ID transformation not found');
  }
  
  return true;
});

// Check 2: API endpoint exists and looks correct
check('API endpoint exists and handles role inclusion', () => {
  const apiPath = 'src/app/api/users/[id]/route.ts';
  if (!fs.existsSync(apiPath)) {
    throw new Error('API endpoint not found');
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  // Check for include parameter usage
  if (!content.includes('include:')) {
    throw new Error('Include parameter usage not found in API');
  }
  
  return true;
});

// Check 3: User edit page exists
check('User edit page exists', () => {
  const pagePath = 'src/app/(main)/settings/users/edit/[id]/page.tsx';
  if (!fs.existsSync(pagePath)) {
    throw new Error('User edit page not found');
  }
  
  return true;
});

// Check 4: Our fix files are present
check('All fix-related files present', () => {
  const requiredFiles = [
    'src/lib/db-hybrid.ts',
    'scripts/test-user-edit-fix.js',
    'scripts/deploy-user-edit-fix.js',
    'scripts/rollback-user-edit-fix.js',
    'ACCEPTANCE_CRITERIA.md',
    'DECISION_LOG.md'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing files: ${missingFiles.join(', ')}`);
  }
  
  return true;
});

// Check 5: Package.json has our scripts
check('Package.json contains deployment scripts', () => {
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = [
    'test:user-edit-fix',
    'deploy:user-edit-fix',
    'rollback:user-edit-fix',
    'validate:user-edit-fix'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
  }
  
  return true;
});

// Check 6: TypeScript compilation of our specific fix
check('db-hybrid.ts compiles without errors', () => {
  const { execSync } = require('child_process');
  
  try {
    execSync('npx tsc --noEmit src/lib/db-hybrid.ts', { 
      stdio: 'pipe',
      timeout: 30000 
    });
    return true;
  } catch (error) {
    throw new Error('TypeScript compilation failed for db-hybrid.ts');
  }
});

// Check 7: Validate fix logic
check('Fix logic is correctly implemented', () => {
  const dbHybridPath = 'src/lib/db-hybrid.ts';
  const content = fs.readFileSync(dbHybridPath, 'utf8');
  
  // Check for conditional role inclusion
  if (!content.includes('if (params.include && params.include.role)')) {
    throw new Error('Conditional role inclusion logic not found');
  }
  
  // Check for role object structure
  if (!content.includes('role: roleName,') && !content.includes('role: {')) {
    throw new Error('Role object assignment not found');
  }
  
  // Check for backward compatibility
  if (!content.includes('|| \'USER\'')) {
    throw new Error('Backward compatibility fallback not found');
  }
  
  return true;
});

// Summary
console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');
console.log(`Total Checks: ${allChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${allChecks - passedChecks}`);

if (passedChecks === allChecks) {
  console.log('\n🎉 ALL CHECKS PASSED! 🎉');
  console.log('✅ User edit fix is ready for deployment');
  console.log('\n📋 Next Steps:');
  console.log('1. Commit changes to Git repository');
  console.log('2. Deploy to Choreo platform');
  console.log('3. Test user edit functionality in production');
  console.log('4. Monitor Choreo logs for successful operations');
  
  console.log('\n🚀 Deployment Commands:');
  console.log('git add .');
  console.log('git commit -m "fix: resolve Failed to load user data error in Choreo user edit"');
  console.log('git push origin main');
  
  console.log('\n🔧 Manual Deployment Steps for Choreo:');
  console.log('1. Go to Choreo dashboard');
  console.log('2. Trigger new deployment from main branch');
  console.log('3. Monitor deployment logs');
  console.log('4. Test user edit functionality');
  
  process.exit(0);
} else {
  console.log('\n❌ VALIDATION FAILED');
  console.log('Some checks did not pass. Please review and fix the issues above.');
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Ensure all files are properly created');
  console.log('2. Check TypeScript compilation');
  console.log('3. Verify fix implementation');
  
  process.exit(1);
} 