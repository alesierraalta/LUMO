#!/usr/bin/env node

/**
 * LUMO Deployment Verification Script
 * Verifies all requirements before Choreo deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'choreo-server.js',
  'Dockerfile',
  '.next/standalone/server.js',
  '.next/build-manifest.json',
  '.next/app-build-manifest.json'
];

const REQUIRED_DIRS = [
  '.next',
  '.next/standalone',
  '.next/static',
  'app/api'
];

const API_ROUTES = [
  'app/api/health/route.ts',
  'app/api/test/route.ts',
  'app/api/urls/route.ts'
];

console.log('🔍 LUMO Deployment Verification');
console.log('================================\n');

let allChecks = true;

function checkExists(filePath, type = 'file') {
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${type}: ${filePath}`);
  
  if (!exists) {
    allChecks = false;
  }
  
  return exists;
}

function checkPackageJson() {
  console.log('📦 Checking package.json scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = ['build', 'start:choreo', 'prebuild', 'postbuild'];
    
    for (const script of requiredScripts) {
      const hasScript = script in scripts;
      const icon = hasScript ? '✅' : '❌';
      console.log(`${icon} Script: ${script}`);
      
      if (!hasScript) {
        allChecks = false;
      }
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    allChecks = false;
  }
  
  console.log('');
}

function checkManifests() {
  console.log('📋 Checking build manifests...');
  
  for (const manifest of ['.next/build-manifest.json', '.next/app-build-manifest.json']) {
    if (checkExists(manifest)) {
      try {
        const content = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        
        // Check for entryCSSFiles
        if (content.entryCSSFiles) {
          console.log(`  ✅ ${manifest} has entryCSSFiles`);
        } else {
          console.log(`  ⚠️  ${manifest} missing entryCSSFiles (will be auto-repaired)`);
        }
      } catch (error) {
        console.log(`  ❌ ${manifest} is not valid JSON`);
        allChecks = false;
      }
    }
  }
  
  console.log('');
}

function checkDockerfile() {
  console.log('🐳 Checking Dockerfile...');
  
  if (checkExists('Dockerfile')) {
    try {
      const content = fs.readFileSync('Dockerfile', 'utf8');
      
      // Check for choreo-server.js
      if (content.includes('choreo-server.js')) {
        console.log('  ✅ Dockerfile uses choreo-server.js');
      } else {
        console.log('  ❌ Dockerfile does not use choreo-server.js');
        allChecks = false;
      }
      
      // Check for port 8080
      if (content.includes('8080')) {
        console.log('  ✅ Dockerfile exposes port 8080');
      } else {
        console.log('  ❌ Dockerfile does not expose port 8080');
        allChecks = false;
      }
    } catch (error) {
      console.log('  ❌ Error reading Dockerfile:', error.message);
      allChecks = false;
    }
  }
  
  console.log('');
}

function checkTailwindConfig() {
  console.log('🎨 Checking CSS configuration...');
  
  // Check globals.css
  if (checkExists('app/globals.css')) {
    try {
      const content = fs.readFileSync('app/globals.css', 'utf8');
      
      if (content.includes('@tailwind base')) {
        console.log('  ✅ Tailwind directives found');
      } else {
        console.log('  ❌ Tailwind directives missing');
        allChecks = false;
      }
      
      // Check for problematic @apply statements
      if (content.includes('@apply')) {
        console.log('  ⚠️  @apply statements found (may cause Tailwind v4 issues)');
      } else {
        console.log('  ✅ No @apply statements (Tailwind v4 compatible)');
      }
    } catch (error) {
      console.log('  ❌ Error reading globals.css:', error.message);
      allChecks = false;
    }
  }
  
  console.log('');
}

function checkLayoutStructure() {
  console.log('🏗️  Checking App Router structure...');
  
  // Check root layout
  if (checkExists('app/layout.tsx')) {
    try {
      const content = fs.readFileSync('app/layout.tsx', 'utf8');
      
      if (content.includes('export default function RootLayout')) {
        console.log('  ✅ Root layout export found');
      } else {
        console.log('  ❌ Root layout export missing');
        allChecks = false;
      }
      
      if (content.includes('export const metadata')) {
        console.log('  ✅ Metadata export found');
      } else {
        console.log('  ❌ Metadata export missing');
        allChecks = false;
      }
      
      if (content.includes('export const viewport')) {
        console.log('  ✅ Viewport export found (Next.js 15+ compatible)');
      } else {
        console.log('  ⚠️  Viewport export missing (may cause warnings)');
      }
    } catch (error) {
      console.log('  ❌ Error reading layout.tsx:', error.message);
      allChecks = false;
    }
  }
  
  console.log('');
}

// Run all checks
console.log('1️⃣ Required files:');
for (const file of REQUIRED_FILES) {
  checkExists(file);
}
console.log('');

console.log('2️⃣ Required directories:');
for (const dir of REQUIRED_DIRS) {
  checkExists(dir, 'directory');
}
console.log('');

console.log('3️⃣ API routes:');
for (const route of API_ROUTES) {
  checkExists(route);
}
console.log('');

checkPackageJson();
checkManifests();
checkDockerfile();
checkTailwindConfig();
checkLayoutStructure();

// Final summary
console.log('📊 Deployment Readiness Summary');
console.log('===============================');

if (allChecks) {
  console.log('🎉 ALL CHECKS PASSED! Ready for Choreo deployment.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Commit all changes to your repository');
  console.log('2. Push to your main branch');
  console.log('3. Trigger Choreo deployment');
  console.log('4. Monitor deployment logs for any issues');
  console.log('');
  console.log('Expected URLs after deployment:');
  console.log('- Homepage: https://your-app.choreoapps.dev/');
  console.log('- Health: https://your-app.choreoapps.dev/api/health');
  console.log('- URLs: https://your-app.choreoapps.dev/api/urls');
  
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED! Please fix the issues above before deploying.');
  console.log('');
  console.log('Common fixes:');
  console.log('- Run: npm run build');
  console.log('- Check: app/layout.tsx exists');
  console.log('- Verify: Dockerfile uses choreo-server.js');
  console.log('- Ensure: All API routes are created');
  
  process.exit(1);
} 