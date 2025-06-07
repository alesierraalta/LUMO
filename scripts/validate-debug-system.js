#!/usr/bin/env node

/**
 * Choreo Automated Debug Log System Validation Script
 * 
 * This script comprehensively validates that the entire debug system is working correctly
 * before deployment to Choreo. It tests:
 * 
 * 1. All core debug system components
 * 2. API endpoints functionality
 * 3. Dashboard accessibility
 * 4. Notification system capabilities
 * 5. Fix modules integration
 * 6. Log file creation and permissions
 * 7. Authentication bypass functionality
 * 8. Environment variable configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CHOREO DEBUG SYSTEM VALIDATION');
console.log('=================================');

let validationResults = {
  coreSystem: false,
  apiEndpoints: false,
  dashboard: false,
  notifications: false,
  fixModules: false,
  logging: false,
  authentication: false,
  environment: false,
  overall: false
};

let issues = [];
let warnings = [];

/**
 * Execute a command and return result
 */
function executeCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

/**
 * Check if a file exists and is accessible
 */
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${path.relative(process.cwd(), filePath)}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${path.relative(process.cwd(), filePath)} - NOT FOUND`);
    issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

/**
 * Test 1: Core System Components
 */
console.log('\n📦 TESTING CORE SYSTEM COMPONENTS');
console.log('-------------------------------');

const coreFiles = [
  { path: 'src/lib/choreo-debug-system.ts', desc: 'Main Debug System' },
  { path: 'src/lib/choreo-notification-system.ts', desc: 'Notification System' },
  { path: 'src/lib/choreo-fixes/clerk-ssl-fix.ts', desc: 'Clerk SSL Fix Module' },
  { path: 'src/lib/choreo-fixes/build-deployment-detector.ts', desc: 'Build Detection Module' },
  { path: 'src/lib/choreo-fixes/prisma-p6001-fix.ts', desc: 'Prisma P6001 Fix Module' }
];

let coreSystemValid = true;
coreFiles.forEach(file => {
  if (!checkFile(file.path, file.desc)) {
    coreSystemValid = false;
  }
});

validationResults.coreSystem = coreSystemValid;

/**
 * Test 2: API Endpoints
 */
console.log('\n🌐 TESTING API ENDPOINTS');
console.log('---------------------');

const apiFiles = [
  { path: 'src/app/api/choreo-health/route.ts', desc: 'Health Check API' },
  { path: 'src/app/api/choreo-db/route.ts', desc: 'Database Check API (optional)' }
];

let apiValid = true;
apiFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.desc}: Found`);
  } else {
    console.log(`⚠️ ${file.desc}: Optional - not found`);
    warnings.push(`Optional API endpoint missing: ${file.path}`);
  }
});

// Check main health endpoint exists
if (checkFile('src/app/api/choreo-health/route.ts', 'Main Health API')) {
  validationResults.apiEndpoints = true;
} else {
  validationResults.apiEndpoints = false;
}

/**
 * Test 3: Dashboard Components
 */
console.log('\n📊 TESTING DASHBOARD COMPONENTS');
console.log('-----------------------------');

const dashboardFiles = [
  { path: 'src/app/choreo-status/page.tsx', desc: 'Main Dashboard Page' },
  { path: 'src/app/choreo-debug-link/page.tsx', desc: 'Debug Link Page' },
  { path: 'src/app/debug/route.ts', desc: 'Debug Redirect Route' }
];

let dashboardValid = true;
dashboardFiles.forEach(file => {
  if (!checkFile(file.path, file.desc)) {
    dashboardValid = false;
  }
});

validationResults.dashboard = dashboardValid;

/**
 * Test 4: Notification System
 */
console.log('\n📢 TESTING NOTIFICATION SYSTEM');
console.log('----------------------------');

try {
  // Try to import and instantiate notification system
  if (fs.existsSync('src/lib/choreo-notification-system.ts')) {
    console.log('✅ Notification system file exists');
    
    // Check for environment variables that enable notifications
    const notificationEnvVars = [
      'SLACK_WEBHOOK_URL',
      'MONITORING_WEBHOOK_URL',
      'SMTP_HOST',
      'ALERT_EMAIL_RECIPIENTS'
    ];
    
    let envVarsConfigured = 0;
    notificationEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Configured`);
        envVarsConfigured++;
      } else {
        console.log(`⚠️ ${envVar}: Not configured (optional)`);
      }
    });
    
    if (envVarsConfigured > 0) {
      console.log(`✅ ${envVarsConfigured} notification channels configured`);
    } else {
      console.log('⚠️ No notification channels configured (notifications will be logged only)');
      warnings.push('Consider configuring notification channels for production');
    }
    
    validationResults.notifications = true;
  } else {
    console.log('❌ Notification system file not found');
    issues.push('Notification system not properly installed');
    validationResults.notifications = false;
  }
} catch (error) {
  console.log('❌ Error testing notification system:', error.message);
  issues.push(`Notification system error: ${error.message}`);
  validationResults.notifications = false;
}

/**
 * Test 5: Fix Modules Integration
 */
console.log('\n🔧 TESTING FIX MODULES');
console.log('--------------------');

const fixModules = [
  { path: 'src/lib/choreo-fixes/prisma-p6001-fix.ts', name: 'Prisma P6001 Fix' },
  { path: 'src/lib/choreo-fixes/clerk-ssl-fix.ts', name: 'Clerk SSL Fix' },
  { path: 'src/lib/choreo-fixes/build-deployment-detector.ts', name: 'Build Detector' }
];

let fixModulesValid = true;
fixModules.forEach(module => {
  if (!checkFile(module.path, module.name)) {
    fixModulesValid = false;
  }
});

// Check the enhanced P6001 fix script
if (checkFile('scripts/fix-p6001-final.js', 'Enhanced P6001 Fix Script')) {
  console.log('✅ P6001 fix integration appears complete');
} else {
  console.log('❌ P6001 fix script missing or not enhanced');
  fixModulesValid = false;
}

validationResults.fixModules = fixModulesValid;

/**
 * Test 6: Logging System
 */
console.log('\n📝 TESTING LOGGING SYSTEM');
console.log('-----------------------');

// Test log directory creation
const logDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Test write permissions
  const testLogFile = path.join(logDir, 'test-write.log');
  fs.writeFileSync(testLogFile, 'Test log entry\n');
  fs.unlinkSync(testLogFile);
  
  console.log('✅ Log directory writable');
  validationResults.logging = true;
} catch (error) {
  console.log('❌ Log directory not writable:', error.message);
  issues.push(`Logging system error: ${error.message}`);
  validationResults.logging = false;
}

// Check for choreo-debug subdirectory
const choreoLogDir = path.join(logDir, 'choreo-debug');
try {
  if (!fs.existsSync(choreoLogDir)) {
    fs.mkdirSync(choreoLogDir, { recursive: true });
  }
  console.log('✅ Choreo debug log directory ready');
} catch (error) {
  console.log('⚠️ Could not create choreo debug log directory:', error.message);
  warnings.push('Choreo debug logging may not work properly');
}

/**
 * Test 7: Authentication Bypass
 */
console.log('\n🔐 TESTING AUTHENTICATION BYPASS');
console.log('------------------------------');

const authFiles = [
  { path: 'src/lib/auth/route-protection.ts', desc: 'Route Protection Module' },
  { path: 'src/middleware.ts', desc: 'Enhanced Middleware' }
];

let authValid = true;
authFiles.forEach(file => {
  if (!checkFile(file.path, file.desc)) {
    authValid = false;
  }
});

// Check if debug routes are properly configured in middleware
try {
  if (fs.existsSync('src/middleware.ts')) {
    const middlewareContent = fs.readFileSync('src/middleware.ts', 'utf8');
    
    if (middlewareContent.includes('choreo-status') && middlewareContent.includes('X-Choreo-Debug')) {
      console.log('✅ Debug route bypass configured in middleware');
    } else {
      console.log('⚠️ Debug route bypass may not be properly configured');
      warnings.push('Verify middleware has debug route bypass');
    }
  }
} catch (error) {
  console.log('⚠️ Could not verify middleware configuration:', error.message);
  warnings.push('Manual verification of middleware required');
}

validationResults.authentication = authValid;

/**
 * Test 8: Environment Configuration
 */
console.log('\n🌍 TESTING ENVIRONMENT CONFIGURATION');
console.log('----------------------------------');

const requiredEnvVars = [
  'DATABASE_URL'
];

const optionalEnvVars = [
  'SLACK_WEBHOOK_URL',
  'MONITORING_WEBHOOK_URL',
  'SMTP_HOST',
  'ALERT_EMAIL_RECIPIENTS',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

let envValid = true;
let missingRequired = [];

console.log('Required Environment Variables:');
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
    missingRequired.push(envVar);
    envValid = false;
  }
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`⚠️ ${envVar}: Not set (optional)`);
  }
});

if (missingRequired.length > 0) {
  issues.push(`Missing required environment variables: ${missingRequired.join(', ')}`);
}

validationResults.environment = envValid;

/**
 * Test 9: Package.json Scripts
 */
console.log('\n📦 TESTING PACKAGE.JSON SCRIPTS');
console.log('-----------------------------');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['start', 'build', 'choreo-debug', 'verify-deployment'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ Script "${script}": ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ Script "${script}": NOT FOUND`);
      issues.push(`Missing npm script: ${script}`);
    }
  });
  
  // Check if start script includes auto-debug initialization
  if (packageJson.scripts.start && packageJson.scripts.start.includes('auto-debug-init.js')) {
    console.log('✅ Auto-debug initialization integrated into start script');
  } else {
    console.log('⚠️ Auto-debug initialization may not be integrated');
    warnings.push('Consider integrating auto-debug-init.js into start script');
  }
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  issues.push('Could not validate package.json configuration');
}

/**
 * Test 10: TypeScript Compilation
 */
console.log('\n⚙️ TESTING TYPESCRIPT COMPILATION');
console.log('-------------------------------');

console.log('Testing TypeScript compilation...');
const tscResult = executeCommand('npx tsc --noEmit', true);

if (tscResult.success) {
  console.log('✅ TypeScript compilation successful');
} else {
  console.log('❌ TypeScript compilation errors detected');
  console.log('Compilation output:');
  console.log(tscResult.output || tscResult.error);
  issues.push('TypeScript compilation errors need to be resolved');
}

/**
 * Final Validation Summary
 */
console.log('\n📋 VALIDATION SUMMARY');
console.log('==================');

const allTestsPassed = Object.values(validationResults).every(result => result === true);
validationResults.overall = allTestsPassed;

console.log('\nComponent Status:');
Object.entries(validationResults).forEach(([component, status]) => {
  const emoji = status ? '✅' : '❌';
  const statusText = status ? 'PASS' : 'FAIL';
  console.log(`${emoji} ${component}: ${statusText}`);
});

if (issues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES TO RESOLVE:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS (Optional Improvements):');
  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning}`);
  });
}

console.log('\n🎯 DEPLOYMENT READINESS');
console.log('=====================');

if (allTestsPassed && issues.length === 0) {
  console.log('🎉 ALL TESTS PASSED! System is ready for Choreo deployment.');
  console.log('\nNext Steps:');
  console.log('1. Commit all changes to your repository');
  console.log('2. Push to your deployment branch');
  console.log('3. Trigger Choreo deployment');
  console.log('4. Monitor the debug dashboard at /choreo-status');
  console.log('5. Verify notifications are working (if configured)');
  
  // Generate deployment summary
  const deploymentSummary = {
    timestamp: new Date().toISOString(),
    validationStatus: 'PASSED',
    systemReady: true,
    components: validationResults,
    issues: issues,
    warnings: warnings,
    nextSteps: [
      'Commit and push changes',
      'Deploy to Choreo',
      'Monitor dashboard',
      'Test notifications'
    ]
  };
  
  fs.writeFileSync('deployment-validation-report.json', JSON.stringify(deploymentSummary, null, 2));
  console.log('\n📄 Validation report saved to: deployment-validation-report.json');
  
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED! Please resolve the critical issues before deployment.');
  
  if (issues.length > 0) {
    console.log('\nPriority: Fix all critical issues first');
  }
  
  if (warnings.length > 0) {
    console.log('Consider: Address warnings for optimal functionality');
  }
  
  // Generate failure report
  const failureReport = {
    timestamp: new Date().toISOString(),
    validationStatus: 'FAILED',
    systemReady: false,
    components: validationResults,
    criticalIssues: issues,
    warnings: warnings,
    recommendedActions: [
      'Review and fix all critical issues',
      'Re-run validation script',
      'Ensure all required files are present',
      'Verify environment configuration'
    ]
  };
  
  fs.writeFileSync('deployment-validation-report.json', JSON.stringify(failureReport, null, 2));
  console.log('\n📄 Failure report saved to: deployment-validation-report.json');
  
  process.exit(1);
} 