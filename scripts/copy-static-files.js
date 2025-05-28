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

function main() {
  console.log('[COPY-STATIC] Starting static file copy process...');
  
  const staticSource = path.join(process.cwd(), '.next', 'static');
  const standaloneStatic = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');
  
  if (!fs.existsSync(staticSource)) {
    console.log('[COPY-STATIC] No static files found to copy');
    return;
  }
  
  if (!fs.existsSync(standaloneStatic)) {
    fs.mkdirSync(standaloneStatic, { recursive: true });
    console.log('[COPY-STATIC] Created standalone static directory');
  }
  
  console.log('[COPY-STATIC] Copying static files...');
  console.log(`[COPY-STATIC] Source: ${staticSource}`);
  console.log(`[COPY-STATIC] Destination: ${standaloneStatic}`);
  
  try {
    copyRecursiveSync(staticSource, standaloneStatic);
    
    // Verify critical directories exist
    const criticalDirs = ['chunks', 'css', 'media'];
    const sourceContents = fs.readdirSync(staticSource);
    const buildIdDir = sourceContents.find(dir => dir.length > 10 && !criticalDirs.includes(dir));
    
    if (buildIdDir) {
      criticalDirs.push(buildIdDir);
      console.log(`[COPY-STATIC] Found build ID directory: ${buildIdDir}`);
    }
    
    for (const dir of criticalDirs) {
      const sourcePath = path.join(staticSource, dir);
      const destPath = path.join(standaloneStatic, dir);
      
      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(destPath)) {
          copyRecursiveSync(sourcePath, destPath);
          console.log(`[COPY-STATIC] ✅ Copied directory: ${dir}`);
        } else {
          console.log(`[COPY-STATIC] ✅ Directory exists: ${dir}`);
        }
      } else {
        console.log(`[COPY-STATIC] ⚠️ Missing source directory: ${dir}`);
      }
    }
    
    console.log('[COPY-STATIC] ✅ Static file copy completed successfully');
    
  } catch (error) {
    console.error('[COPY-STATIC] ❌ Error copying static files:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 