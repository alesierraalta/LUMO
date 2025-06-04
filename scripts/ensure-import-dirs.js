/**
 * Script to ensure all required import directories exist
 * This runs before the server starts to prepare the environment
 */

const fs = require('fs');
const path = require('path');

console.log('📁 Ensuring import directories exist...');

// List of directories to ensure exist
const directories = [
  // Import processing directories
  path.join(process.cwd(), '.next/server/app/api/inventory/import/process/dict'),
  path.join(process.cwd(), '.next/standalone/.next/server/app/api/inventory/import/process/dict'),
  
  // Prisma client directory
  path.join(process.cwd(), 'node_modules/.prisma/client'),
  
  // Ensure scripts directory in standalone mode
  path.join(process.cwd(), '.next/standalone/scripts'),

  // Ensure server-only module is available
  path.join(process.cwd(), '.next/standalone/node_modules/server-only'),
];

// Create directories if they don't exist
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✓ Directory already exists: ${dir}`);
  }
});

// Ensure scripts are copied to standalone directory if we're in production
if (process.env.NODE_ENV === 'production') {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const standaloneScriptsDir = path.join(process.cwd(), '.next/standalone/scripts');
  
  // Critical scripts to ensure are available
  const criticalScripts = [
    'fix-import-session-postgres.js',
    'fix-import-session-sqlite.js',
    'fix-import-session-auto.js',
    'choreo-preflight.js',
    'verify-deployment.js',
    'ensure-import-dirs.js',
  ];
  
  if (fs.existsSync(scriptsDir)) {
    // Create standalone scripts directory if it doesn't exist
    if (!fs.existsSync(standaloneScriptsDir)) {
      fs.mkdirSync(standaloneScriptsDir, { recursive: true });
    }
    
    // Copy critical scripts to standalone directory
    criticalScripts.forEach(script => {
      const sourcePath = path.join(scriptsDir, script);
      const destPath = path.join(standaloneScriptsDir, script);
      
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Copied script: ${script}`);
          
          // Make script executable
          fs.chmodSync(destPath, 0o755);
        } catch (error) {
          console.error(`❌ Error copying script ${script}:`, error);
        }
      } else {
        console.warn(`⚠️ Script not found: ${sourcePath}`);
      }
    });
  }

  // Ensure server-only module is available
  const serverOnlyDir = path.join(process.cwd(), 'node_modules/server-only');
  const standaloneServerOnlyDir = path.join(process.cwd(), '.next/standalone/node_modules/server-only');
  
  if (fs.existsSync(serverOnlyDir)) {
    // Create standalone server-only directory if it doesn't exist
    if (!fs.existsSync(standaloneServerOnlyDir)) {
      fs.mkdirSync(standaloneServerOnlyDir, { recursive: true });
      
      // Copy package.json if it exists
      const packageJsonPath = path.join(serverOnlyDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        fs.copyFileSync(packageJsonPath, path.join(standaloneServerOnlyDir, 'package.json'));
      }
      
      // Copy index.js if it exists
      const indexJsPath = path.join(serverOnlyDir, 'index.js');
      if (fs.existsSync(indexJsPath)) {
        fs.copyFileSync(indexJsPath, path.join(standaloneServerOnlyDir, 'index.js'));
      }
      
      console.log('✅ Copied server-only module to standalone directory');
    }
  } else {
    console.warn('⚠️ server-only module not found in node_modules');
  }
}

console.log('📁 Import directories setup complete!'); 