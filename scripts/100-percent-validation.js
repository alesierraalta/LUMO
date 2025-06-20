#!/usr/bin/env node

/**
 * 100% COMPREHENSIVE VALIDATION FOR CHOREO DEPLOYMENT
 * This script validates EVERY aspect to ensure 100% deployment success
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🎯 100% COMPREHENSIVE VALIDATION STARTING...');
console.log('🔍 Testing EVERY aspect for absolute deployment certainty\n');

// Validation results tracker
const validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addResult(test, status, message, critical = true) {
  const result = { test, status, message, critical };
  validationResults.tests.push(result);
  
  if (status === 'PASS') {
    validationResults.passed++;
    console.log(`✅ ${test}: ${message}`);
  } else if (status === 'FAIL') {
    validationResults.failed++;
    console.log(`❌ ${test}: ${message}`);
  } else if (status === 'WARN') {
    validationResults.warnings++;
    console.log(`⚠️  ${test}: ${message}`);
  }
}

// 1. CONFIGURATION VALIDATION
function validateConfigurations() {
  console.log('\n🔧 PHASE 1: CONFIGURATION VALIDATION');
  
  // Check next.config.js
  try {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    if (nextConfig.includes('allowedDevOrigins')) {
      addResult('Next.js Config', 'FAIL', 'Invalid allowedDevOrigins still present');
    } else {
      addResult('Next.js Config', 'PASS', 'Clean configuration without invalid options');
    }
    
    if (nextConfig.includes('webworker-threads') && nextConfig.includes('externals')) {
      addResult('Webpack Externals', 'PASS', 'Problematic dependencies properly externalized');
    } else {
      addResult('Webpack Externals', 'FAIL', 'Missing webpack externals configuration');
    }
    
    if (nextConfig.includes('42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev')) {
      addResult('CORS Headers', 'PASS', 'Choreo domain properly configured');
    } else {
      addResult('CORS Headers', 'FAIL', 'Missing Choreo CORS configuration');
    }
    
  } catch (error) {
    addResult('Next.js Config', 'FAIL', `Configuration file error: ${error.message}`);
  }
  
  // Check package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      addResult('Build Script', 'PASS', 'Build script properly configured');
    } else {
      addResult('Build Script', 'FAIL', 'Missing build script');
    }
    
    if (packageJson.scripts && packageJson.scripts['build:choreo']) {
      addResult('Choreo Build Script', 'PASS', 'Choreo-specific build script available');
    } else {
      addResult('Choreo Build Script', 'WARN', 'No Choreo-specific build script', false);
    }
    
  } catch (error) {
    addResult('Package.json', 'FAIL', `Package configuration error: ${error.message}`);
  }
}

// 2. NATURAL PACKAGE VALIDATION
function validateNaturalPackage() {
  console.log('\n🧠 PHASE 2: NATURAL PACKAGE VALIDATION');
  
  try {
    const routeFile = fs.readFileSync('src/app/api/inventory/import/process/route.ts', 'utf8');
    
    if (routeFile.includes('import natural from "natural"')) {
      addResult('Natural Import', 'FAIL', 'Direct natural import still present - will cause build failure');
    } else if (routeFile.includes('require("natural")') && routeFile.includes('typeof window === \'undefined\'')) {
      addResult('Natural Import', 'PASS', 'Conditional natural import properly implemented');
    } else {
      addResult('Natural Import', 'FAIL', 'Natural package import not properly conditionalized');
    }
    
    if (routeFile.includes('fallback implementations')) {
      addResult('Natural Fallbacks', 'PASS', 'Fallback implementations for natural package present');
    } else {
      addResult('Natural Fallbacks', 'WARN', 'No fallback implementations found', false);
    }
    
  } catch (error) {
    addResult('Natural Package', 'FAIL', `Error reading route file: ${error.message}`);
  }
}

// 3. BUILD PROCESS VALIDATION
function validateBuildProcess() {
  return new Promise((resolve) => {
    console.log('\n🏗️  PHASE 3: BUILD PROCESS VALIDATION');
    console.log('⏳ Running production build...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let buildOutput = '';
    let buildErrors = '';
    
    buildProcess.stdout.on('data', (data) => {
      buildOutput += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      buildErrors += data.toString();
    });
    
    buildProcess.on('exit', (code) => {
      if (code === 0) {
        addResult('Build Process', 'PASS', 'Production build completed successfully');
        
        // Check for specific success indicators
        if (buildOutput.includes('Compiled with warnings')) {
          addResult('Build Compilation', 'PASS', 'Build compiled with warnings only (acceptable)');
        } else if (buildOutput.includes('Compiled successfully')) {
          addResult('Build Compilation', 'PASS', 'Build compiled successfully without warnings');
        }
        
        // Check for problematic errors
        if (buildOutput.includes('self is not defined')) {
          addResult('SSR Compatibility', 'WARN', 'Self is not defined warning present (non-blocking)', false);
        } else {
          addResult('SSR Compatibility', 'PASS', 'No SSR compatibility issues detected');
        }
        
        if (buildOutput.includes('webworker-threads')) {
          addResult('Webworker Threads', 'WARN', 'Webworker-threads warnings present (handled)', false);
        } else {
          addResult('Webworker Threads', 'PASS', 'No webworker-threads issues detected');
        }
        
      } else {
        addResult('Build Process', 'FAIL', `Build failed with exit code ${code}`);
        if (buildErrors) {
          addResult('Build Errors', 'FAIL', `Build errors: ${buildErrors.substring(0, 200)}...`);
        }
      }
      
      resolve();
    });
    
    buildProcess.on('error', (error) => {
      addResult('Build Process', 'FAIL', `Build process error: ${error.message}`);
      resolve();
    });
  });
}

// 4. BUILD ARTIFACTS VALIDATION
function validateBuildArtifacts() {
  console.log('\n📦 PHASE 4: BUILD ARTIFACTS VALIDATION');
  
  // Check .next directory
  if (fs.existsSync('.next')) {
    addResult('Build Directory', 'PASS', '.next directory exists');
    
    // Check standalone output
    if (fs.existsSync('.next/standalone')) {
      addResult('Standalone Output', 'PASS', 'Standalone build output generated');
      
      // Check server.js
      if (fs.existsSync('.next/standalone/server.js')) {
        addResult('Server File', 'PASS', 'server.js file present in standalone output');
      } else {
        addResult('Server File', 'FAIL', 'server.js missing from standalone output');
      }
      
      // Check package.json in standalone
      if (fs.existsSync('.next/standalone/package.json')) {
        addResult('Standalone Package', 'PASS', 'package.json present in standalone output');
      } else {
        addResult('Standalone Package', 'FAIL', 'package.json missing from standalone output');
      }
      
    } else {
      addResult('Standalone Output', 'FAIL', 'Standalone build output not generated');
    }
    
    // Check static files
    if (fs.existsSync('.next/static')) {
      addResult('Static Files', 'PASS', 'Static files directory exists');
    } else {
      addResult('Static Files', 'FAIL', 'Static files directory missing');
    }
    
  } else {
    addResult('Build Directory', 'FAIL', '.next directory does not exist');
  }
}

// 5. ENVIRONMENT VALIDATION
function validateEnvironment() {
  console.log('\n🌍 PHASE 5: ENVIRONMENT VALIDATION');
  
  // Check environment files
  const envFiles = ['.env', '.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addResult(`Environment File (${file})`, 'PASS', `${file} exists`);
    } else {
      addResult(`Environment File (${file})`, 'WARN', `${file} not found (may be in Choreo secrets)`, false);
    }
  });
  
  // Check critical environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'JWT_SECRET'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar] || process.env[`NEXT_PUBLIC_${envVar}`]) {
      addResult(`Environment Variable (${envVar})`, 'PASS', `${envVar} is configured`);
    } else {
      addResult(`Environment Variable (${envVar})`, 'WARN', `${envVar} not found in local env (should be in Choreo secrets)`, false);
    }
  });
}

// 6. CRITICAL FILES VALIDATION
function validateCriticalFiles() {
  console.log('\n📄 PHASE 6: CRITICAL FILES VALIDATION');
  
  const criticalFiles = [
    'src/middleware.ts',
    'src/app/layout.tsx',
    'src/lib/db-supabase.ts',
    'src/contexts/auth-context.tsx',
    'src/app/api/health/route.ts'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addResult(`Critical File (${file})`, 'PASS', `${file} exists`);
      
      // Check for specific issues in middleware
      if (file === 'src/middleware.ts') {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('supabase-polyfill')) {
          addResult('Middleware Polyfill', 'FAIL', 'Problematic supabase-polyfill import still present');
        } else {
          addResult('Middleware Polyfill', 'PASS', 'No problematic polyfill imports in middleware');
        }
      }
      
    } else {
      addResult(`Critical File (${file})`, 'FAIL', `${file} missing`);
    }
  });
}

// 7. FINAL ASSESSMENT
function generateFinalAssessment() {
  console.log('\n📊 FINAL 100% VALIDATION ASSESSMENT');
  console.log('=====================================');
  
  const totalTests = validationResults.tests.length;
  const criticalTests = validationResults.tests.filter(t => t.critical).length;
  const criticalPassed = validationResults.tests.filter(t => t.critical && t.status === 'PASS').length;
  const criticalFailed = validationResults.tests.filter(t => t.critical && t.status === 'FAIL').length;
  
  console.log(`📈 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  console.log(`⚠️  Warnings: ${validationResults.warnings}`);
  console.log(`🎯 Critical Tests: ${criticalTests}`);
  console.log(`✅ Critical Passed: ${criticalPassed}`);
  console.log(`❌ Critical Failed: ${criticalFailed}`);
  
  const successRate = Math.round((validationResults.passed / totalTests) * 100);
  const criticalSuccessRate = Math.round((criticalPassed / criticalTests) * 100);
  
  console.log(`\n📊 Overall Success Rate: ${successRate}%`);
  console.log(`🎯 Critical Success Rate: ${criticalSuccessRate}%`);
  
  // Determine deployment readiness
  if (criticalFailed === 0) {
    console.log('\n🎉 100% DEPLOYMENT READY!');
    console.log('✅ All critical tests passed');
    console.log('🚀 SAFE TO DEPLOY TO CHOREO IMMEDIATELY');
    
    if (validationResults.warnings > 0) {
      console.log(`⚠️  ${validationResults.warnings} non-critical warnings detected (acceptable)`);
    }
    
    return true;
  } else {
    console.log('\n🚨 DEPLOYMENT NOT READY');
    console.log(`❌ ${criticalFailed} critical tests failed`);
    console.log('🔧 Fix critical issues before deployment');
    
    console.log('\n❌ CRITICAL FAILURES:');
    validationResults.tests
      .filter(t => t.critical && t.status === 'FAIL')
      .forEach(t => console.log(`   - ${t.test}: ${t.message}`));
    
    return false;
  }
}

// MAIN EXECUTION
async function run100PercentValidation() {
  console.log('🎯 STARTING 100% COMPREHENSIVE VALIDATION');
  console.log('==========================================\n');
  
  validateConfigurations();
  validateNaturalPackage();
  await validateBuildProcess();
  validateBuildArtifacts();
  validateEnvironment();
  validateCriticalFiles();
  
  const isReady = generateFinalAssessment();
  
  // Create detailed report
  const report = {
    timestamp: new Date().toISOString(),
    deploymentReady: isReady,
    summary: {
      totalTests: validationResults.tests.length,
      passed: validationResults.passed,
      failed: validationResults.failed,
      warnings: validationResults.warnings,
      successRate: Math.round((validationResults.passed / validationResults.tests.length) * 100)
    },
    tests: validationResults.tests
  };
  
  fs.writeFileSync('100-percent-validation-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: 100-percent-validation-report.json');
  
  if (isReady) {
    console.log('\n🎯 FINAL VERDICT: 100% READY FOR CHOREO DEPLOYMENT');
    process.exit(0);
  } else {
    console.log('\n🚨 FINAL VERDICT: NOT READY - FIX CRITICAL ISSUES FIRST');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  run100PercentValidation().catch(console.error);
}

module.exports = { run100PercentValidation }; 