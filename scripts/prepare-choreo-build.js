/**
 * Choreo Build Preparation Script
 * 
 * This script prepares the codebase for Choreo deployment by:
 * - Removing problematic routes that cause build issues
 * - Creating placeholder pages for disabled routes
 * - Ensuring the build process completes successfully
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Preparing codebase for Choreo deployment...');

// List of problematic paths that should be removed during build
const problematicPaths = [
  'src/app/(main)/inventory/scan-duplicates',
  'src/app/api/debug',
  'src/app/api/health-advanced',
  'src/app/api/health-simple',
  'src/app/api/logs',
  'src/app/api/status',
  'src/app/api/choreo-health',
  'src/app/api/choreo-db',
];

// Function to remove a path completely
function removePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    console.log(`🗑️ Removing: ${targetPath}`);
    
    // Remove the path completely
    fs.rmSync(targetPath, { recursive: true, force: true });
    
    // Create a placeholder page if it was a page route
    if (targetPath.includes('app/') && !targetPath.includes('api/')) {
      const placeholderDir = targetPath;
      const placeholderFile = path.join(placeholderDir, 'page.tsx');
      
      // Create directory
      fs.mkdirSync(placeholderDir, { recursive: true });
      
      // Create placeholder page
      const placeholderContent = `export default function DisabledPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Funcionalidad Temporalmente Deshabilitada</h1>
      <p>Esta funcionalidad está temporalmente deshabilitada durante el despliegue.</p>
      <p>Estará disponible una vez que la aplicación esté completamente desplegada.</p>
    </div>
  );
}`;
      
      fs.writeFileSync(placeholderFile, placeholderContent);
      console.log(`✅ Created placeholder page: ${placeholderFile}`);
    }
    
    return true;
  }
  
  return false;
}

// Remove problematic paths
let removedCount = 0;
for (const problematicPath of problematicPaths) {
  if (removePath(problematicPath)) {
    removedCount++;
  }
}

console.log(`✅ Successfully removed ${removedCount} problematic paths`);
console.log('🚀 Ready for Choreo deployment!'); 