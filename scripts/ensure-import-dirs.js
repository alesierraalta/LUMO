/**
 * This script ensures that the necessary directories exist for import functionality
 */

const fs = require('fs');
const path = require('path');

console.log('📁 Ensuring import directories exist...');

// Directory paths that need to exist
const requiredDirs = [
  // Development paths
  '.next/server/app/api/inventory/import/process/dict',
  
  // Production paths (standalone mode)
  '.next/standalone/.next/server/app/api/inventory/import/process/dict',
  'node_modules/.prisma/client',
];

// Create directories if they don't exist
for (const dir of requiredDirs) {
  try {
    const fullPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${fullPath}`);
    } else {
      console.log(`✓ Directory already exists: ${fullPath}`);
    }
  } catch (error) {
    console.error(`❌ Error creating directory ${dir}: ${error.message}`);
  }
}

console.log('📁 Import directories setup complete!'); 