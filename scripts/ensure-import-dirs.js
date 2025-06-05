/**
 * Script to ensure all required import directories exist
 * This runs before the server starts to prepare the environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📁 Ensuring import directories exist...');

// List of required directories
const requiredDirectories = [
  // Import processing directories
  {
    path: path.join(process.cwd(), '.next/server/app/api/inventory/import/process/dict'),
    description: 'Import Dictionary Directory',
    permissions: 0o775, // rwxrwxr-x - Owner and group can read/write/execute, others can read/execute
    critical: true
  },
  {
    path: path.join(process.cwd(), '.next/standalone/.next/server/app/api/inventory/import/process/dict'),
    description: 'Import Dictionary Directory (Standalone)',
    permissions: 0o775,
    critical: true
  },
  
  // Prisma client directory
  {
    path: path.join(process.cwd(), 'node_modules/.prisma/client'),
    description: 'Prisma Client Directory',
    permissions: 0o775,
    critical: true
  },
  
  // Ensure scripts directory in standalone mode
  {
    path: path.join(process.cwd(), '.next/standalone/scripts'),
    description: 'Standalone Scripts Directory',
    permissions: 0o775,
    critical: true
  },

  // Ensure server-only module is available
  {
    path: path.join(process.cwd(), '.next/standalone/node_modules/server-only'),
    description: 'Server-Only Module Directory',
    permissions: 0o775,
    critical: false
  },
  
  // Logs directory
  {
    path: path.join(process.cwd(), 'logs'),
    description: 'Logs Directory',
    permissions: 0o775,
    critical: true
  },
  
  // Temp directory for file uploads
  {
    path: path.join(process.cwd(), 'tmp'),
    description: 'Temporary Uploads Directory',
    permissions: 0o775,
    critical: false
  },
  
  // Add additional required directories here
];

// Critical scripts that should be copied in production
const criticalScripts = [
  // Import session scripts
  {
    name: 'fix-import-session-postgres.js',
    permissions: 0o755, // rwxr-xr-x - Executable by all, writable only by owner
    critical: true
  },
  {
    name: 'fix-import-session-sqlite.js',
    permissions: 0o755,
    critical: true
  },
  {
    name: 'run-import-session-migration.js',
    permissions: 0o755,
    critical: true
  },
  {
    name: 'import-session-preflight.js',
    permissions: 0o755,
    critical: true
  },
  {
    name: 'verify-import-schema.js',
    permissions: 0o755,
    critical: true
  },
  
  // Core scripts
  {
    name: 'choreo-preflight.js',
    permissions: 0o755,
    critical: true
  },
  {
    name: 'verify-deployment.js',
    permissions: 0o755,
    critical: false
  },
  {
    name: 'ensure-import-dirs.js',
    permissions: 0o755,
    critical: true
  },
  {
    name: 'audit-import-session-migrations.js',
    permissions: 0o755,
    critical: false
  },
];

// Function to check if we're in production environment
function isProductionEnv() {
  return process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
}

// Function to test file/directory permissions
function testPermissions(pathToTest, isDir = true) {
  try {
    // Test read access
    fs.accessSync(pathToTest, fs.constants.R_OK);
    
    // Test write access
    if (isDir) {
      // For directories, test by creating a temp file
      const testFile = path.join(pathToTest, `.test-${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } else {
      // For files, test with access
      fs.accessSync(pathToTest, fs.constants.W_OK);
    }
    
    // Test execute access for directories
    if (isDir) {
      fs.accessSync(pathToTest, fs.constants.X_OK);
    }
    
    return {
      readable: true,
      writable: true,
      executable: isDir ? true : undefined,
      pathExists: true
    };
  } catch (error) {
    return {
      readable: false,
      writable: false, 
      executable: false,
      pathExists: fs.existsSync(pathToTest),
      error: error.message
    };
  }
}

// Function to ensure directories exist with correct permissions
function ensureDirectories() {
  const results = {
    success: true,
    created: [],
    failed: [],
    permissionsFailed: [],
    alreadyExisted: []
  };

  requiredDirectories.forEach(dir => {
    try {
      // Check if directory exists
      if (!fs.existsSync(dir.path)) {
        // Create directory with recursive option
        fs.mkdirSync(dir.path, { 
          recursive: true,
          // Use specified permissions if on Unix-like system
          mode: process.platform !== 'win32' ? dir.permissions : undefined 
        });
        console.log(`✅ Created directory: ${dir.description} (${dir.path})`);
        results.created.push(dir.path);
      } else {
        console.log(`✓ Directory already exists: ${dir.description} (${dir.path})`);
        results.alreadyExisted.push(dir.path);
        
        // Set permissions on existing directory if on Unix-like system
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(dir.path, dir.permissions);
          } catch (permError) {
            console.warn(`⚠️ Could not set permissions on ${dir.path}: ${permError.message}`);
          }
        }
      }
      
      // Test permissions
      const permResult = testPermissions(dir.path, true);
      if (!permResult.readable || !permResult.writable || !permResult.executable) {
        console.error(`❌ Permission issue with directory ${dir.path}: ` + 
                     `Read: ${permResult.readable}, Write: ${permResult.writable}, Execute: ${permResult.executable}`);
        results.permissionsFailed.push(dir.path);
        
        // Only mark failure if this is a critical directory
        if (dir.critical) {
          results.success = false;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir.path}: ${error.message}`);
      results.failed.push(dir.path);
      
      // Only mark failure if this is a critical directory
      if (dir.critical) {
        results.success = false;
      }
    }
  });
  
  return results;
}

// Function to copy critical scripts to standalone directory in production
function ensureCriticalScripts() {
  // Only copy scripts in production environment
  if (!isProductionEnv()) {
    return { success: true, skipped: true };
  }
  
  const results = {
    success: true,
    copied: [],
    failed: [],
    notFound: [],
    permissionsFailed: []
  };
  
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const standaloneScriptsDir = path.join(process.cwd(), '.next/standalone/scripts');
  
  // Ensure standalone scripts directory exists
  if (!fs.existsSync(standaloneScriptsDir)) {
    try {
      fs.mkdirSync(standaloneScriptsDir, { recursive: true });
      console.log(`✅ Created standalone scripts directory: ${standaloneScriptsDir}`);
    } catch (error) {
      console.error(`❌ Failed to create standalone scripts directory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  // Copy each critical script
  if (fs.existsSync(scriptsDir)) {
    criticalScripts.forEach(script => {
      const sourcePath = path.join(scriptsDir, script.name);
      const destPath = path.join(standaloneScriptsDir, script.name);
      
      if (fs.existsSync(sourcePath)) {
        try {
          // Copy the script
          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Copied script: ${script.name}`);
          results.copied.push(script.name);
          
          // Make script executable (Unix-like systems only)
          if (process.platform !== 'win32') {
            try {
              fs.chmodSync(destPath, script.permissions);
            } catch (chmodError) {
              console.warn(`⚠️ Could not set permissions on ${script.name}: ${chmodError.message}`);
            }
          }
          
          // Test permissions
          const permResult = testPermissions(destPath, false);
          if (!permResult.readable || !permResult.writable) {
            console.error(`❌ Permission issue with script ${script.name}: ` + 
                        `Read: ${permResult.readable}, Write: ${permResult.writable}`);
            results.permissionsFailed.push(script.name);
            
            // Only mark failure if this is a critical script
            if (script.critical) {
              results.success = false;
            }
          }
        } catch (error) {
          console.error(`❌ Error copying script ${script.name}: ${error.message}`);
          results.failed.push(script.name);
          
          // Only mark failure if this is a critical script
          if (script.critical) {
            results.success = false;
          }
        }
      } else {
        console.warn(`⚠️ Script not found: ${script.name}`);
        results.notFound.push(script.name);
        
        // Only mark failure if this is a critical script
        if (script.critical) {
          results.success = false;
        }
      }
    });
  } else {
    console.error(`❌ Scripts directory not found: ${scriptsDir}`);
    results.success = false;
  }
  
  return results;
}

// Function to ensure server-only module in standalone mode
function ensureServerOnlyModule() {
  // Only needed in production
  if (!isProductionEnv()) {
    return { success: true, skipped: true };
  }
  
  const serverOnlyDir = path.join(process.cwd(), 'node_modules/server-only');
  const standaloneServerOnlyDir = path.join(process.cwd(), '.next/standalone/node_modules/server-only');
  
  if (!fs.existsSync(serverOnlyDir)) {
    console.warn('⚠️ server-only module not found in node_modules');
    return { success: false, error: 'Module not found' };
  }
  
  try {
    // Create standalone server-only directory if it doesn't exist
    if (!fs.existsSync(standaloneServerOnlyDir)) {
      fs.mkdirSync(standaloneServerOnlyDir, { recursive: true });
    }
    
    // Copy required files
    const filesToCopy = ['package.json', 'index.js'];
    
    filesToCopy.forEach(file => {
      const sourcePath = path.join(serverOnlyDir, file);
      const destPath = path.join(standaloneServerOnlyDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file} to server-only module in standalone directory`);
      }
    });
    
    console.log('✅ Server-only module setup in standalone directory');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to setup server-only module:', error.message);
    return { success: false, error: error.message };
  }
}

// Check disk space
function checkDiskSpace() {
  try {
    // Use df command on Linux/Mac or PowerShell on Windows
    let freeSpace;
    
    if (process.platform === 'win32') {
      // Windows
      const result = execSync('powershell -command "Get-PSDrive C | Select-Object Free"', 
                          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const match = result.match(/\d+/);
      freeSpace = match ? parseInt(match[0]) : null;
    } else {
      // Linux/Mac
      const result = execSync('df -k . | tail -1 | awk \'{print $4}\'', 
                          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      freeSpace = parseInt(result.trim()) * 1024; // Convert KB to bytes
    }
    
    const freeSpaceMB = Math.round(freeSpace / (1024 * 1024));
    
    if (freeSpaceMB < 100) { // Less than 100MB free
      console.error(`⚠️ Very low disk space: ${freeSpaceMB}MB free`);
      return { success: false, freeSpaceMB };
    } else {
      console.log(`✅ Sufficient disk space: ${freeSpaceMB}MB free`);
      return { success: true, freeSpaceMB };
    }
  } catch (error) {
    console.warn(`⚠️ Could not check disk space: ${error.message}`);
    return { success: true, error: error.message }; // Consider it a non-critical error
  }
}

// Main function to run all checks and directory creation
function main() {
  console.log('🔍 Starting directory and environment verification...');
  
  // Check disk space
  const diskSpace = checkDiskSpace();
  
  // Ensure all required directories exist
  const dirResults = ensureDirectories();
  
  // Copy critical scripts in production
  const scriptsResults = ensureCriticalScripts();
  
  // Ensure server-only module
  const serverOnlyResults = ensureServerOnlyModule();
  
  // Summary
  const allSuccessful = dirResults.success && scriptsResults.success && serverOnlyResults.success;
  
  console.log('\n📋 Directory Verification Summary:');
  console.log(`🔍 Disk space: ${diskSpace.success ? '✅' : '❌'} ${diskSpace.freeSpaceMB || 'Unknown'} MB free`);
  console.log(`🔍 Directories: ${dirResults.success ? '✅ All critical directories verified' : '❌ Some critical directories failed'}`);
  console.log(`🔍 Scripts: ${scriptsResults.skipped ? '⏩ Skipped (non-production)' : (scriptsResults.success ? '✅ All critical scripts copied' : '❌ Some critical scripts failed')}`);
  console.log(`🔍 Server-only module: ${serverOnlyResults.skipped ? '⏩ Skipped (non-production)' : (serverOnlyResults.success ? '✅ Configured' : '❌ Failed')}`);
  
  if (!allSuccessful) {
    console.error(`❌ Some critical components failed verification.`);
    
    // In production, continue but warn
    if (isProductionEnv()) {
      console.warn(`⚠️ Running in production mode, will continue despite errors. System may be unstable.`);
    }
  }
  
  // Create a status file
  const statusData = {
    timestamp: new Date().toISOString(),
    environment: {
      production: isProductionEnv(),
      platform: process.platform,
      nodeVersion: process.version
    },
    diskSpace,
    directories: dirResults,
    scripts: scriptsResults,
    serverOnlyModule: serverOnlyResults,
    success: allSuccessful
  };
  
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(logsDir, 'directory-verification.json'),
      JSON.stringify(statusData, null, 2)
    );
  } catch (error) {
    console.error('❌ Failed to write status file:', error.message);
  }
  
  console.log('📁 Directory verification complete!');
  
  // In non-production, exit with error code if verification failed
  if (!isProductionEnv() && !allSuccessful) {
    process.exit(1);
  }
}

// Run the main function
main(); 