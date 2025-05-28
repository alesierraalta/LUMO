/**
 * Copy Static Files for Standalone Build
 * 
 * Ensures all static assets are properly copied to the standalone directory
 * for proper deployment on platforms like Choreo.
 */

const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`[COPY-STATIC] Copied: ${src} -> ${dest}`);
    }
  }
}

function copyStaticFiles() {
  console.log('[COPY-STATIC] Starting static file copy process...');
  
  // Define source and destination paths
  const srcStatic = path.join(process.cwd(), '.next', 'static');
  const destStatic = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');
  
  console.log('[COPY-STATIC] Copying static files...');
  console.log(`[COPY-STATIC] Source: ${srcStatic}`);
  console.log(`[COPY-STATIC] Destination: ${destStatic}`);
  
  // Copy all static files
  if (fs.existsSync(srcStatic)) {
    copyRecursiveSync(srcStatic, destStatic);
  } else {
    console.log('[COPY-STATIC] ⚠️ Source static directory not found');
  }
  
  // Copy public files (including env-config.js)
  const srcPublic = path.join(process.cwd(), 'public');
  const destPublic = path.join(process.cwd(), '.next', 'standalone', 'public');
  
  if (fs.existsSync(srcPublic)) {
    console.log('[COPY-STATIC] Copying public files...');
    console.log(`[COPY-STATIC] Source: ${srcPublic}`);
    console.log(`[COPY-STATIC] Destination: ${destPublic}`);
    
    // Ensure destination exists
    if (!fs.existsSync(destPublic)) {
      fs.mkdirSync(destPublic, { recursive: true });
    }
    
    // Copy all public files
    fs.readdirSync(srcPublic).forEach(file => {
      const srcFile = path.join(srcPublic, file);
      const destFile = path.join(destPublic, file);
      
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`[COPY-STATIC] Copied public file: ${file}`);
      }
    });
  } else {
    console.log('[COPY-STATIC] ⚠️ Public directory not found');
  }
  
  // Special handling for env-config.js - ensure it's available at multiple locations
  const envConfigSrc = path.join(process.cwd(), 'public', 'env-config.js');
  if (fs.existsSync(envConfigSrc)) {
    console.log('[COPY-STATIC] Ensuring env-config.js is available at all required locations...');
    
    // Copy to standalone public
    const envConfigPublicDest = path.join(process.cwd(), '.next', 'standalone', 'public', 'env-config.js');
    if (!fs.existsSync(path.dirname(envConfigPublicDest))) {
      fs.mkdirSync(path.dirname(envConfigPublicDest), { recursive: true });
    }
    fs.copyFileSync(envConfigSrc, envConfigPublicDest);
    console.log(`[COPY-STATIC] ✅ env-config.js copied to: ${envConfigPublicDest}`);
    
    // Copy to standalone root (for direct serving)
    const envConfigRootDest = path.join(process.cwd(), '.next', 'standalone', 'env-config.js');
    fs.copyFileSync(envConfigSrc, envConfigRootDest);
    console.log(`[COPY-STATIC] ✅ env-config.js copied to: ${envConfigRootDest}`);
    
    // Copy to standalone .next root (backup location)
    const envConfigNextDest = path.join(process.cwd(), '.next', 'standalone', '.next', 'env-config.js');
    fs.copyFileSync(envConfigSrc, envConfigNextDest);
    console.log(`[COPY-STATIC] ✅ env-config.js copied to: ${envConfigNextDest}`);
  } else {
    console.log('[COPY-STATIC] ⚠️ env-config.js not found in public directory');
  }
  
  // Verify critical directories exist
  const criticalDirs = ['chunks', 'css', 'media'];
  const buildId = findBuildId();
  if (buildId) {
    criticalDirs.push(buildId);
  }
  
  criticalDirs.forEach(dir => {
    const dirPath = path.join(destStatic, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`[COPY-STATIC] ✅ Directory exists: ${dir}`);
    } else {
      console.log(`[COPY-STATIC] ⚠️ Directory missing: ${dir}`);
    }
  });
}

function findBuildId() {
  try {
    const staticDir = path.join(process.cwd(), '.next', 'static');
    if (!fs.existsSync(staticDir)) return null;
    
    const items = fs.readdirSync(staticDir);
    const buildId = items.find(item => {
      const itemPath = path.join(staticDir, item);
      return fs.statSync(itemPath).isDirectory() && 
             item !== 'chunks' && 
             item !== 'css' && 
             item !== 'media';
    });
    
    if (buildId) {
      console.log(`[COPY-STATIC] Found build ID directory: ${buildId}`);
    }
    
    return buildId;
  } catch (error) {
    console.log('[COPY-STATIC] Could not determine build ID:', error.message);
    return null;
  }
}

function main() {
  try {
    copyStaticFiles();
    console.log('[COPY-STATIC] ✅ Static file copy completed successfully');
  } catch (error) {
    console.error('[COPY-STATIC] ❌ Error copying static files:', error);
    process.exit(1);
  }
}

// Run the script
main();

module.exports = { copyStaticFiles, main }; 