#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script for LUMO Inventory
 * Ensures all requirements are met before deploying to Choreo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LUMO Pre-Deployment Verification');
console.log('====================================');

let errors = [];
let warnings = [];

// Check critical files
const criticalFiles = [
  'package.json',
  'next.config.js', 
  'choreo.yaml',
  'Dockerfile',
  'choreo-server.js',
  'server.js',
  'src/app/api/health/route.ts',
  'prisma/schema.prisma'
];

console.log('\n📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    errors.push(`Missing critical file: ${file}`);
  }
});

// Check Next.js build configuration
console.log('\n⚙️ Checking Next.js configuration...');
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  
  if (nextConfig.includes('output: \'standalone\'')) {
    console.log('✅ Standalone output configured');
  } else {
    errors.push('Missing standalone output configuration in next.config.js');
  }
  
  if (nextConfig.includes('serverExternalPackages')) {
    console.log('✅ Prisma externalization configured');
  } else {
    warnings.push('Consider adding Prisma to serverExternalPackages');
  }
} catch (error) {
  errors.push('Cannot read next.config.js');
}

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['build', 'start', 'prebuild', 'postbuild'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      errors.push(`Missing required script: ${script}`);
    }
  });
  
  // Check dependencies
  const criticalDeps = ['next', '@prisma/client', 'prisma'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ Dependency: ${dep}`);
    } else {
      errors.push(`Missing critical dependency: ${dep}`);
    }
  });
} catch (error) {
  errors.push('Cannot read package.json');
}

// Check Choreo configuration
console.log('\n🎯 Checking Choreo configuration...');
try {
  const choreoConfig = fs.readFileSync('choreo.yaml', 'utf8');
  
  if (choreoConfig.includes('DATABASE_URL')) {
    console.log('✅ Database URL configured');
  } else {
    errors.push('Missing DATABASE_URL in choreo.yaml');
  }
  
  if (choreoConfig.includes('JWT_SECRET')) {
    console.log('✅ JWT authentication configured');
  } else {
    errors.push('Missing JWT_SECRET in choreo.yaml');
  }
  
  if (choreoConfig.includes('/api/health')) {
    console.log('✅ Health check endpoint configured');
  } else {
    warnings.push('Health check endpoint not found in choreo.yaml');
  }
} catch (error) {
  errors.push('Cannot read choreo.yaml');
}

// Check Prisma setup
console.log('\n🗄️ Checking Prisma configuration...');
if (fs.existsSync('prisma/schema.prisma')) {
  try {
    const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    
    if (prismaSchema.includes('generator client')) {
      console.log('✅ Prisma client generator configured');
    } else {
      errors.push('Missing Prisma client generator');
    }
    
    if (prismaSchema.includes('datasource db')) {
      console.log('✅ Database source configured');
    } else {
      errors.push('Missing database source in Prisma schema');
    }
  } catch (error) {
    warnings.push('Cannot read Prisma schema');
  }
}

// Check build directory structure (if .next exists)
if (fs.existsSync('.next')) {
  console.log('\n🏗️ Checking build artifacts...');
  
  const buildFiles = [
    '.next/standalone/server.js',
    '.next/build-manifest.json',
    '.next/static'
  ];
  
  buildFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      warnings.push(`Build artifact missing: ${file} (run 'npm run build')`);
    }
  });
}

// Environment variables check
console.log('\n🔑 Environment Variables Checklist...');
console.log('📝 Required in Choreo Secrets:');
console.log('   - DATABASE_URL');
console.log('   - JWT_SECRET');

// Final report
console.log('\n📊 Pre-Deployment Summary');
console.log('=========================');

if (errors.length === 0) {
  console.log('✅ All critical checks passed!');
  
  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} warning(s):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🚀 Ready for Choreo deployment!');
  console.log('\nNext steps:');
  console.log('1. Commit and push your changes');
  console.log('2. Configure secrets in Choreo dashboard');
  console.log('3. Deploy your component');
  
  process.exit(0);
} else {
  console.log(`❌ ${errors.length} error(s) found:`);
  errors.forEach(error => console.log(`   - ${error}`));
  
  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} warning(s):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🔧 Please fix the errors before deploying.');
  process.exit(1);
} 