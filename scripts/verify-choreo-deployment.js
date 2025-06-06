#!/usr/bin/env node

/**
 * Verify Choreo Deployment Configuration
 * This script checks that all necessary configurations are in place for successful Choreo deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Choreo deployment configuration...\n');

let allChecks = true;

// Check 1: Prisma Schema Binary Targets
console.log('1️⃣ Checking Prisma binary targets...');
const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const hasDebianTarget = schemaContent.includes('debian-openssl-3.0.x');
  const hasNativeTarget = schemaContent.includes('"native"');
  
  if (hasDebianTarget && hasNativeTarget) {
    console.log('   ✅ Binary targets correctly configured for Choreo');
  } else {
    console.log('   ❌ Missing required binary targets for Choreo deployment');
    console.log('   Expected: ["native", "debian-openssl-3.0.x"]');
    allChecks = false;
  }
} else {
  console.log('   ❌ Prisma schema not found');
  allChecks = false;
}

// Check 2: Package.json scripts
console.log('\n2️⃣ Checking package.json scripts...');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = ['prebuild', 'build', 'start'];
  
  let scriptsOk = true;
  requiredScripts.forEach(script => {
    if (packageContent.scripts && packageContent.scripts[script]) {
      console.log(`   ✅ ${script} script exists`);
    } else {
      console.log(`   ❌ Missing ${script} script`);
      scriptsOk = false;
    }
  });
  
  if (!scriptsOk) allChecks = false;
} else {
  console.log('   ❌ package.json not found');
  allChecks = false;
}

// Check 3: Required dependencies
console.log('\n3️⃣ Checking required dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const requiredDeps = ['@prisma/client', 'prisma', 'next'];

requiredDeps.forEach(dep => {
  const depPath = path.join(nodeModulesPath, dep);
  if (fs.existsSync(depPath)) {
    console.log(`   ✅ ${dep} installed`);
  } else {
    console.log(`   ❌ ${dep} not installed`);
    allChecks = false;
  }
});

// Check 4: Scripts directory
console.log('\n4️⃣ Checking deployment scripts...');
const scriptsDir = path.join(process.cwd(), 'scripts');
const requiredScripts = [
  'fix-prisma-binaries.js',
  'manifest-validator.js',
  'prepare-choreo-build.js'
];

requiredScripts.forEach(script => {
  const scriptPath = path.join(scriptsDir, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`   ✅ ${script} exists`);
  } else {
    console.log(`   ❌ ${script} missing`);
    allChecks = false;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('🎉 All checks passed! Ready for Choreo deployment.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
} 