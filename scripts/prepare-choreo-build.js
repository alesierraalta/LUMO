/**
 * This script prepares the codebase for Choreo deployment
 * by temporarily disabling problematic features/routes
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Preparing codebase for Choreo deployment...');

// List of problematic directories to temporarily disable
const problematicPaths = [
  'src/app/(main)/inventory/scan-duplicates',
  'src/app/api/inventory/scan-duplicates',
  'src/app/api/inventory/merge-duplicates',
];

// Function to safely rename a directory by adding .disabled suffix
function disablePath(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const disabledPath = `${dirPath}.disabled`;
      console.log(`🔧 Disabling: ${dirPath} → ${disabledPath}`);
      
      // If the disabled path already exists, remove it first
      if (fs.existsSync(disabledPath)) {
        try {
          fs.rmSync(disabledPath, { recursive: true, force: true });
        } catch (error) {
          console.log(`⚠️ Warning: Could not remove existing disabled path: ${error.message}`);
        }
      }
      
      try {
        fs.renameSync(dirPath, disabledPath);
        return true;
      } catch (error) {
        console.log(`❌ Error disabling path: ${error.message}`);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.log(`❌ Error checking path: ${error.message}`);
    return false;
  }
}

// Disable problematic paths
let disabledCount = 0;
for (const dirPath of problematicPaths) {
  if (disablePath(dirPath)) {
    disabledCount++;
  }
}

// Create placeholder pages for disabled routes
problematicPaths.forEach(dirPath => {
  if (dirPath.includes('api')) return; // Skip API routes
  
  try {
    // Create a placeholder page
    const placeholderDir = dirPath;
    if (!fs.existsSync(placeholderDir)) {
      try {
        fs.mkdirSync(placeholderDir, { recursive: true });
        
        // Create a simple page.tsx file
        const pagePath = path.join(placeholderDir, 'page.tsx');
        const pageContent = `
export default function DisabledFeaturePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Feature Temporarily Disabled</h1>
      <p className="mb-2">This feature is temporarily disabled in the production environment.</p>
      <p>Please contact your administrator for more information.</p>
    </div>
  );
}
`;
        fs.writeFileSync(pagePath, pageContent);
        console.log(`✅ Created placeholder page: ${pagePath}`);
      } catch (error) {
        console.log(`❌ Error creating placeholder page: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error processing path ${dirPath}: ${error.message}`);
  }
});

console.log(`✅ Successfully disabled ${disabledCount} problematic paths`);
console.log('🚀 Ready for Choreo deployment!'); 