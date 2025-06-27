#!/usr/bin/env node

/**
 * LUMO CLEANUP SCRIPT - Remove Redundant Files
 * Ultra-efficient cleanup to maintain only essential optimized files
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LUMO Cleanup - Removing Redundant Files');
console.log('==========================================');

// Files to delete from root directory
const rootFilesToDelete = [
  'lumo-hybrid-server.js',           // Replaced by lumo-optimized-server.js
  'hybrid-server-v2.js',             // Obsolete
  'hybrid-server.js',                // Obsolete
  'production-server.js',            // Obsolete
  'runtime-protection.js',           // No longer needed
  'test-legacy-auth.js',             // Obsolete
  'fix-duplicate-detection.js',      // Obsolete
  'fix-neq-issue.js',                // Obsolete
  'fix-test-utilities.js',           // Obsolete
  'fix-deletemany-methods.js',       // Obsolete
  'next.config.dev-optimized.js',    // Obsolete
  'next.config.simple.js',           // Obsolete
  'next.config.backup.js',           // Obsolete
  'Dockerfile-fixed',                // Obsolete
  'Dockerfile-optimized',            // Obsolete
  'Dockerfile-backup',               // Obsolete
  'Dockerfile.simple',               // Obsolete
  'choreo-simple.yaml',              // Obsolete
  'choreo-optimized.yaml',           // Obsolete
  'choreo-backup.yaml',              // Obsolete
  'start.sh'                         // No longer needed
];

// Scripts to delete
const scriptsToDelete = [
  'deploy-lumo-final.bat',           // Replaced by deploy-optimized-final.bat
  'test-lumo-hybrid.js',             // Replaced by test-optimized-server.js
  'intelligent-startup.js',          // Replaced by intelligent-startup-optimized.js
  'deploy-hybrid-to-choreo.bat',     // Obsolete
  'test-hybrid.bat',                 // Obsolete
  'test-hybrid-server.js',           // Obsolete
  'choreo-deployment-strategy.js',   // Obsolete
  'choreo-build-retry.bat',          // Obsolete
  'choreo-network-fix.js',           // Obsolete
  'create-emergency-manifests.js',   // Obsolete
  'immediate-build-id-fix.js',       // Obsolete
  'emergency-build-id-fix.js',       // Obsolete
  'simple-production-fix.js',        // Obsolete
  'fix-production-build.js',         // Obsolete
  'optimize-dev-startup.js',         // Obsolete
  'prevent-typescript-install.js',   // Obsolete
  'apply-dev-optimizations.bat',     // Obsolete
  'choreo-runtime-setup-build-only.js', // Obsolete
  'github-test-choreo.js',           // Obsolete
  'test-choreo-build.js',            // Obsolete
  'validate-choreo-environments.js', // Obsolete
  'test-docker-build.js',            // Obsolete
  'retry-deployment.js',             // Obsolete
  'choreo-dns-fix.js',               // Obsolete
  'monitor-choreo-deployment.js',    // Obsolete
  'choreo-startup.sh',               // Obsolete
  'fix-choreo-production-timeout.js', // Obsolete
  'diagnose-choreo-production.js',   // Obsolete
  'test-choreo-admin-fix.js',        // Obsolete
  'test-local-admin.js',             // Obsolete
  'ensure-admin-access-choreo.js',   // Obsolete
  'test-choreo-admin-access.js',     // Obsolete
  'confirm-email-production.js',     // Obsolete
  'fix-root-user-production.js',     // Obsolete
  'build-with-error-handling.js',    // Obsolete
  'choreo-build-success.js',         // Obsolete
  'build-bypass-data-collection.js', // Obsolete
  'final-100-percent-validation.js', // Obsolete
  'emergency-build-fix.js',          // Obsolete
  'complete-all-tasks.js',           // Obsolete
  'comprehensive-validation.js',     // Obsolete
  'crash-recovery.js',               // Obsolete
  'validate-stability.js',           // Obsolete
  'validate-server-stability.js',    // Obsolete
  'monitor-memory.js',               // Obsolete
  'optimize-memory-usage.js',        // Obsolete
  'emergency-choreo-fix.js',         // Obsolete
  'commit-and-push.js',              // Obsolete
  'test-custom-server.js',           // Obsolete
  'debug-getCurrentUser.js',         // Obsolete
  'test-middleware-fix.js',          // Obsolete
  'debug-middleware-cookies.js',     // Obsolete
  'test-email-query-fix.js',         // Obsolete
  'test-auth-context-fix.js',        // Obsolete
  'test-frontend-simulation.js',     // Obsolete
  'test-supabase-me-endpoint.js',    // Obsolete
  'test-locations-fix.js',           // Obsolete
  'debug-locations-auth.js',         // Obsolete
  'test-current-stock-fix.js',       // Obsolete
  'test-inventory-fix.js',           // Obsolete
  'fix-all-permission-pages.js',     // Obsolete
  'debug-user-permissions.js',       // Obsolete
  'test-users-api-token-fix.js',     // Obsolete
  'test-users-api-fix.js',           // Obsolete
  'test-auth-provider-fix.js',       // Obsolete
  'test-infinite-loop-final-verification.js', // Obsolete
  'test-infinite-loop-final-debug.js', // Obsolete
  'test-loop-debugging.js',          // Obsolete
  'test-infinite-loop-fix.js',       // Obsolete
  'test-browser-simulation.js',      // Obsolete
  'test-complete-login-flow.js',     // Obsolete
  'test-full-auth-flow.js',          // Obsolete
  'test-login.js',                   // Obsolete
  'create-root-user-simple.js',      // Obsolete
  'create-supabase-root-user.js',    // Obsolete
  'test-polyfill-optimization.js',   // Obsolete
  'setup-dev-environment.js',        // Obsolete
  'ensure-single-root-user.js',      // Obsolete
  'test-auth-fix.js',                // Obsolete
  'test-github-actions-fix.js',      // Obsolete
  'debug-failing-tests.js',          // Obsolete
  'validate-github-actions-fix.js',  // Obsolete
  'test-database-fix.js',            // Obsolete
  'fix-github-actions.js',           // Obsolete
  'fix-supabase-deleteall-method.js', // Obsolete
  'fix-supabase-not-method.js',      // Obsolete
  'fix-neq-method-errors.js'         // Obsolete
];

// Function to safely delete file
function safeDelete(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${filePath}`);
      return true;
    } else {
      console.log(`⚪ Not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error deleting ${filePath}: ${error.message}`);
    return false;
  }
}

// Main cleanup execution
let deletedCount = 0;
let totalFiles = rootFilesToDelete.length + scriptsToDelete.length;

console.log(`\n🎯 Target: ${totalFiles} redundant files to clean\n`);

// Delete root files
console.log('🗂️ Cleaning root directory...');
rootFilesToDelete.forEach(file => {
  if (safeDelete(file)) deletedCount++;
});

// Delete script files
console.log('\n📜 Cleaning scripts directory...');
scriptsToDelete.forEach(file => {
  const scriptPath = path.join('scripts', file);
  if (safeDelete(scriptPath)) deletedCount++;
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 CLEANUP SUMMARY:`);
console.log(`✅ Successfully deleted: ${deletedCount} files`);
console.log(`⚪ Files not found: ${totalFiles - deletedCount} files`);
console.log(`🎯 Cleanup efficiency: ${Math.round((deletedCount / totalFiles) * 100)}%`);

console.log('\n🧹 ESSENTIAL FILES REMAINING:');
console.log('✅ lumo-optimized-server.js (main server)');
console.log('✅ scripts/test-optimized-server.js (testing)');
console.log('✅ scripts/intelligent-startup-optimized.js (startup)');
console.log('✅ scripts/deploy-optimized-final.bat (deployment)');
console.log('✅ emergency-standalone-server.js (fallback)');

console.log('\n🎉 CLEANUP COMPLETED! Project is now ultra-clean and optimized.'); 