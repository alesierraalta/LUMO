/**
 * This script restores previously disabled features
 * after a successful Choreo deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring disabled features...');

// Function to find all .disabled directories and restore them
function findAndRestoreDisabledPaths(baseDir = '.') {
  const items = fs.readdirSync(baseDir, { withFileTypes: true });
  let restoredCount = 0;

  for (const item of items) {
    const fullPath = path.join(baseDir, item.name);
    
    if (item.isDirectory()) {
      // Recursively search in subdirectories
      restoredCount += findAndRestoreDisabledPaths(fullPath);
    } else if (fullPath.endsWith('.disabled') && fs.statSync(fullPath).isDirectory()) {
      // Found a disabled directory, restore it
      const originalPath = fullPath.slice(0, -9); // Remove .disabled suffix
      
      // Remove placeholder if it exists
      if (fs.existsSync(originalPath)) {
        fs.rmSync(originalPath, { recursive: true, force: true });
      }
      
      // Restore the original directory
      fs.renameSync(fullPath, originalPath);
      console.log(`✅ Restored: ${fullPath} → ${originalPath}`);
      restoredCount++;
    }
  }

  return restoredCount;
}

// Look specifically for disabled directories we created
const disabledDirs = [
  'src/app/(main)/inventory/scan-duplicates.disabled',
  'src/app/api/inventory/scan-duplicates.disabled',
  'src/app/api/inventory/merge-duplicates.disabled',
];

// First try the specific paths we know were disabled
let restoredCount = 0;
for (const disabledDir of disabledDirs) {
  if (fs.existsSync(disabledDir)) {
    const originalPath = disabledDir.slice(0, -9); // Remove .disabled suffix
    
    // Remove placeholder if it exists
    if (fs.existsSync(originalPath)) {
      fs.rmSync(originalPath, { recursive: true, force: true });
    }
    
    // Restore the original directory
    fs.renameSync(disabledDir, originalPath);
    console.log(`✅ Restored: ${disabledDir} → ${originalPath}`);
    restoredCount++;
  }
}

// If no specific paths were found, do a general search
if (restoredCount === 0) {
  restoredCount = findAndRestoreDisabledPaths();
}

console.log(`✅ Restored ${restoredCount} disabled features`);
console.log('🚀 All features available again!'); 