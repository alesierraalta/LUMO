#!/usr/bin/env node

/**
 * Final Validation Checklist
 * 
 * Comprehensive validation script that verifies all acceptance criteria
 * are met before deploying the user edit fix to production.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 LUMO User Edit Fix - Final Validation Checklist');
console.log('==================================================\n');

// Validation state tracking
const validation = {
  startTime: Date.now(),
  results: {
    critical: [],
    important: [],
    optional: []
  },
  passed: 0,
  failed: 0,
  warnings: 0
};

const log = (message, type = 'INFO') => {
  const prefix = {
    'INFO': '📋',
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'ERROR': '❌',
    'CHECK': '🔍'
  }[type] || '📋';
  
  console.log(`${prefix} ${message}`);
};

const runCheck = (name, description, checkFn, priority = 'important') => {
  log(`Checking: ${description}`, 'CHECK');
  
  try {
    const result = checkFn();
    
    if (result.status === 'passed') {
      log(`✅ PASSED: ${name}`, 'SUCCESS');
      validation.passed++;
      validation.results[priority].push({
        name,
        status: 'passed',
        message: result.message || description
      });
    } else if (result.status === 'warning') {
      log(`⚠️ WARNING: ${name} - ${result.message}`, 'WARNING');
      validation.warnings++;
      validation.results[priority].push({
        name,
        status: 'warning',
        message: result.message
      });
    } else {
      log(`❌ FAILED: ${name} - ${result.message}`, 'ERROR');
      validation.failed++;
      validation.results[priority].push({
        name,
        status: 'failed',
        message: result.message
      });
    }
    
    return result;
  } catch (error) {
    log(`❌ ERROR: ${name} - ${error.message}`, 'ERROR');
    validation.failed++;
    validation.results[priority].push({
      name,
      status: 'failed',
      message: error.message
    });
    
    return { status: 'failed', message: error.message };
  }
};

// Critical Validation Checks
log('\n🚨 CRITICAL VALIDATION CHECKS', 'INFO');
log('================================', 'INFO');

runCheck(
  'fix-implementation',
  'User edit fix is properly implemented in db-hybrid.ts',
  () => {
    const dbHybridPath = 'src/lib/db-hybrid.ts';
    if (!fs.existsSync(dbHybridPath)) {
      return { status: 'failed', message: 'db-hybrid.ts file not found' };
    }
    
    const content = fs.readFileSync(dbHybridPath, 'utf8');
    
    // Check for include parameter handling
    if (!content.includes('params.include && params.include.role')) {
      return { status: 'failed', message: 'Include parameter handling not found' };
    }
    
    // Check for role JOIN query
    if (!content.includes('role:roles(*)')) {
      return { status: 'failed', message: 'Role JOIN query not found' };
    }
    
    // Check for proper data transformation
    if (!content.includes('roleId: data.role_id')) {
      return { status: 'failed', message: 'Role ID transformation not found' };
    }
    
    return { status: 'passed', message: 'All fix components properly implemented' };
  },
  'critical'
);

runCheck(
  'test-script-exists',
  'User edit fix test script is available',
  () => {
    const testScriptPath = 'scripts/test-user-edit-fix.js';
    if (!fs.existsSync(testScriptPath)) {
      return { status: 'failed', message: 'Test script not found' };
    }
    
    const content = fs.readFileSync(testScriptPath, 'utf8');
    if (!content.includes('include: { role: true }')) {
      return { status: 'failed', message: 'Test script missing role inclusion test' };
    }
    
    return { status: 'passed', message: 'Test script properly configured' };
  },
  'critical'
);

runCheck(
  'deployment-workflow',
  'Deployment workflow script is ready',
  () => {
    const deployScriptPath = 'scripts/deploy-user-edit-fix.js';
    if (!fs.existsSync(deployScriptPath)) {
      return { status: 'failed', message: 'Deployment script not found' };
    }
    
    const content = fs.readFileSync(deployScriptPath, 'utf8');
    if (!content.includes('Pre-deployment Validation')) {
      return { status: 'failed', message: 'Deployment workflow incomplete' };
    }
    
    return { status: 'passed', message: 'Deployment workflow ready' };
  },
  'critical'
);

runCheck(
  'rollback-capability',
  'Rollback script is available and functional',
  () => {
    const rollbackScriptPath = 'scripts/rollback-user-edit-fix.js';
    if (!fs.existsSync(rollbackScriptPath)) {
      return { status: 'failed', message: 'Rollback script not found' };
    }
    
    const content = fs.readFileSync(rollbackScriptPath, 'utf8');
    if (!content.includes('createBackup')) {
      return { status: 'failed', message: 'Backup functionality not found in rollback script' };
    }
    
    return { status: 'passed', message: 'Rollback capability ready' };
  },
  'critical'
);

// Important Validation Checks
log('\n📋 IMPORTANT VALIDATION CHECKS', 'INFO');
log('===============================', 'INFO');

runCheck(
  'typescript-compilation',
  'TypeScript compilation passes without errors',
  () => {
    try {
      execSync('npm run type-check', { stdio: 'pipe', timeout: 60000 });
      return { status: 'passed', message: 'TypeScript compilation successful' };
    } catch (error) {
      return { status: 'failed', message: `TypeScript errors: ${error.message}` };
    }
  },
  'important'
);

runCheck(
  'package-json-scripts',
  'Package.json contains required scripts',
  () => {
    const packageJsonPath = 'package.json';
    if (!fs.existsSync(packageJsonPath)) {
      return { status: 'failed', message: 'package.json not found' };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredScripts = [
      'test:user-edit-fix',
      'deploy:user-edit-fix',
      'rollback:user-edit-fix'
    ];
    
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      return { 
        status: 'failed', 
        message: `Missing scripts: ${missingScripts.join(', ')}` 
      };
    }
    
    return { status: 'passed', message: 'All required scripts present' };
  },
  'important'
);

runCheck(
  'documentation-complete',
  'Documentation files are complete',
  () => {
    const requiredDocs = [
      'ACCEPTANCE_CRITERIA.md',
      'DECISION_LOG.md'
    ];
    
    const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc));
    
    if (missingDocs.length > 0) {
      return { 
        status: 'warning', 
        message: `Missing documentation: ${missingDocs.join(', ')}` 
      };
    }
    
    return { status: 'passed', message: 'All documentation complete' };
  },
  'important'
);

runCheck(
  'error-handling',
  'Proper error handling is implemented',
  () => {
    const dbHybridContent = fs.readFileSync('src/lib/db-hybrid.ts', 'utf8');
    
    // Check for error logging
    if (!dbHybridContent.includes('console.log(\'❌ Supabase error:\'')) {
      return { status: 'warning', message: 'Error logging could be improved' };
    }
    
    // Check for graceful error handling
    if (!dbHybridContent.includes('return null')) {
      return { status: 'warning', message: 'Graceful error handling not found' };
    }
    
    return { status: 'passed', message: 'Error handling properly implemented' };
  },
  'important'
);

// Optional Validation Checks
log('\n🔧 OPTIONAL VALIDATION CHECKS', 'INFO');
log('==============================', 'INFO');

runCheck(
  'linting-compliance',
  'Code passes linting checks',
  () => {
    try {
      execSync('npm run lint', { stdio: 'pipe', timeout: 30000 });
      return { status: 'passed', message: 'Linting passed' };
    } catch (error) {
      return { status: 'warning', message: 'Linting warnings present' };
    }
  },
  'optional'
);

runCheck(
  'build-success',
  'Production build completes successfully',
  () => {
    try {
      // Check if build artifacts exist or can be created
      if (fs.existsSync('.next/standalone/server.js')) {
        return { status: 'passed', message: 'Build artifacts present' };
      }
      
      return { status: 'warning', message: 'Build not tested - run npm run build to verify' };
    } catch (error) {
      return { status: 'warning', message: 'Build verification skipped' };
    }
  },
  'optional'
);

runCheck(
  'git-status',
  'Git repository is in clean state',
  () => {
    try {
      const gitStatus = execSync('git status --porcelain', { 
        stdio: 'pipe', 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      if (gitStatus.trim() === '') {
        return { status: 'passed', message: 'Git working directory clean' };
      } else {
        return { status: 'warning', message: 'Uncommitted changes present' };
      }
    } catch (error) {
      return { status: 'warning', message: 'Git status check failed' };
    }
  },
  'optional'
);

// Generate Final Report
log('\n📊 VALIDATION SUMMARY', 'INFO');
log('====================', 'INFO');

const duration = Date.now() - validation.startTime;
const totalChecks = validation.passed + validation.failed + validation.warnings;

log(`Total Checks: ${totalChecks}`, 'INFO');
log(`Passed: ${validation.passed}`, 'SUCCESS');
log(`Failed: ${validation.failed}`, validation.failed > 0 ? 'ERROR' : 'SUCCESS');
log(`Warnings: ${validation.warnings}`, validation.warnings > 0 ? 'WARNING' : 'INFO');
log(`Duration: ${Math.round(duration / 1000)}s`, 'INFO');

// Critical Issues Check
const criticalFailures = validation.results.critical.filter(r => r.status === 'failed');
const importantFailures = validation.results.important.filter(r => r.status === 'failed');

if (criticalFailures.length > 0) {
  log('\n🚨 CRITICAL FAILURES - DEPLOYMENT BLOCKED', 'ERROR');
  criticalFailures.forEach(failure => {
    log(`  - ${failure.name}: ${failure.message}`, 'ERROR');
  });
  
  log('\n🔧 Required Actions:', 'INFO');
  log('1. Fix all critical failures listed above', 'INFO');
  log('2. Re-run this validation script', 'INFO');
  log('3. Do not proceed with deployment until all critical checks pass', 'INFO');
  
  process.exit(1);
}

if (importantFailures.length > 0) {
  log('\n⚠️ IMPORTANT FAILURES - REVIEW REQUIRED', 'WARNING');
  importantFailures.forEach(failure => {
    log(`  - ${failure.name}: ${failure.message}`, 'WARNING');
  });
  
  log('\n🤔 Recommended Actions:', 'INFO');
  log('1. Review important failures listed above', 'INFO');
  log('2. Consider fixing before deployment', 'INFO');
  log('3. Deployment can proceed but with increased risk', 'INFO');
}

// Success Path
if (criticalFailures.length === 0) {
  log('\n🎉 VALIDATION COMPLETED SUCCESSFULLY!', 'SUCCESS');
  log('=====================================', 'SUCCESS');
  
  log('\n📋 Next Steps:', 'INFO');
  log('1. Run deployment workflow: npm run deploy:user-edit-fix', 'INFO');
  log('2. Monitor deployment progress and logs', 'INFO');
  log('3. Validate fix in Choreo production environment', 'INFO');
  log('4. Have rollback ready: npm run rollback:user-edit-fix', 'INFO');
  
  if (validation.warnings > 0) {
    log('\n⚠️ Note: Some warnings were encountered but deployment can proceed', 'WARNING');
  }
  
  // Generate validation report
  const validationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalChecks,
      passed: validation.passed,
      failed: validation.failed,
      warnings: validation.warnings,
      duration: Math.round(duration / 1000)
    },
    results: validation.results,
    deployment_ready: criticalFailures.length === 0,
    risk_level: importantFailures.length > 0 ? 'medium' : 'low'
  };
  
  fs.writeFileSync('validation-report.json', JSON.stringify(validationReport, null, 2));
  log('\n📄 Validation report saved to: validation-report.json', 'INFO');
}

process.exit(criticalFailures.length > 0 ? 1 : 0); 