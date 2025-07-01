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
  // List all scripts except essential ones
  'deploy-lumo-final.bat',
  'test-lumo-hybrid.js',
  'intelligent-startup.js',
  'deploy-hybrid-to-choreo.bat',
  'test-hybrid.bat',
  'test-hybrid-server.js',
  'choreo-deployment-strategy.js',
  'choreo-build-retry.bat',
  'choreo-network-fix.js',
  'create-emergency-manifests.js',
  'immediate-build-id-fix.js',
  'emergency-build-id-fix.js',
  'simple-production-fix.js',
  'fix-production-build.js',
  'optimize-dev-startup.js',
  'prevent-typescript-install.js',
  'apply-dev-optimizations.bat',
  'choreo-runtime-setup-build-only.js',
  'github-test-choreo.js',
  'test-choreo-build.js',
  'validate-choreo-environments.js',
  'test-docker-build.js',
  'retry-deployment.js',
  'choreo-dns-fix.js',
  'monitor-choreo-deployment.js',
  'choreo-startup.sh',
  'fix-choreo-production-timeout.js',
  'diagnose-choreo-production.js',
  'test-choreo-admin-fix.js',
  'test-local-admin.js',
  'ensure-admin-access-choreo.js',
  'test-choreo-admin-access.js',
  'confirm-email-production.js',
  'fix-root-user-production.js',
  'build-with-error-handling.js',
  'choreo-build-success.js',
  'build-bypass-data-collection.js',
  'final-100-percent-validation.js',
  // Add any other non-essential scripts here
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