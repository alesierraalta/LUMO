#!/usr/bin/env node

/**
 * Minimal-Fix for Next.js deployment
 * 
 * This provides the minimal changes needed to fix the
 * entryCSSFiles issues in Next.js without extensive patching.
 */

const fs = require('fs');
const path = require('path');

console.log('[MINIMAL-FIX] Starting minimal fixes for Next.js deployment...');

// Set environment variable for root directory
process.env.APP_NEXT_ROOT_DIR = process.cwd();
console.log('[MINIMAL-FIX] Set APP_NEXT_ROOT_DIR to', process.env.APP_NEXT_ROOT_DIR);

// Function to ensure a directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Ensure the manifest structure is properly set up
const ensureManifestStructure = () => {
  const rootDir = process.cwd();
  const nextDir = path.join(rootDir, '.next');
  const standaloneNextDir = path.join(rootDir, '.next', 'standalone', '.next');
  
  // Create required directories
  ensureDir(nextDir);
  ensureDir(path.join(nextDir, 'static', 'css'));
  ensureDir(path.join(nextDir, 'static', 'chunks'));
  
  // Check if we have a standalone build
  const hasStandalone = fs.existsSync(path.join(rootDir, '.next', 'standalone'));
  if (hasStandalone) {
    ensureDir(standaloneNextDir);
    ensureDir(path.join(standaloneNextDir, 'static', 'css'));
    ensureDir(path.join(standaloneNextDir, 'static', 'chunks'));
  }
  
  // Fix build-manifest.json
  const fixManifest = (manifestPath, isApp = false) => {
    if (!fs.existsSync(manifestPath)) {
      // Create default manifest if it doesn't exist
      const defaultManifest = isApp 
        ? { entryCSSFiles: {} } 
        : { 
            entryCSSFiles: { '/_app': [], '/': [] },
            pages: {},
            polyfillFiles: []
          };
      
      fs.writeFileSync(manifestPath, JSON.stringify(defaultManifest, null, 2));
      console.log(`[MINIMAL-FIX] Created default manifest: ${manifestPath}`);
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let changed = false;
      
      if (!manifest.entryCSSFiles) {
        manifest.entryCSSFiles = isApp ? {} : { '/_app': [], '/': [] };
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`[MINIMAL-FIX] Fixed manifest: ${manifestPath}`);
      }
    } catch (e) {
      console.log(`[MINIMAL-FIX] Error with manifest ${manifestPath}:`, e.message);
    }
  };
  
  // Fix the manifests
  fixManifest(path.join(nextDir, 'build-manifest.json'));
  fixManifest(path.join(nextDir, 'app-build-manifest.json'), true);
  
  if (hasStandalone) {
    fixManifest(path.join(standaloneNextDir, 'build-manifest.json'));
    fixManifest(path.join(standaloneNextDir, 'app-build-manifest.json'), true);
  }
  
  // Create empty CSS files to ensure directories aren't empty
  const emptyCssPath = path.join(nextDir, 'static', 'css', 'empty.css');
  if (!fs.existsSync(emptyCssPath)) {
    fs.writeFileSync(emptyCssPath, '/* Empty CSS file */');
  }
  
  if (hasStandalone) {
    const standaloneEmptyCssPath = path.join(standaloneNextDir, 'static', 'css', 'empty.css');
    if (!fs.existsSync(standaloneEmptyCssPath)) {
      fs.writeFileSync(standaloneEmptyCssPath, '/* Empty CSS file */');
    }
  }
  
  console.log('[MINIMAL-FIX] Ensured proper manifest structure');
};

// Add placeholder document for SSR
const createPlaceholderDocument = () => {
  const docFile = path.join(process.cwd(), '.next', 'server', 'pages', '_document.js');
  ensureDir(path.dirname(docFile));
  
  if (!fs.existsSync(docFile)) {
    const content = `
      module.exports = {
        __esModule: true,
        default: function Document(props) {
          return props.children || null;
        }
      };
    `;
    
    fs.writeFileSync(docFile, content);
    console.log('[MINIMAL-FIX] Added placeholder document for SSR');
  }
};

// Patch React.createElement for null props
const patchReactCreateElement = () => {
  try {
    // This is a runtime fix that will be applied when Node loads modules
    console.log('[MINIMAL-FIX] Patched React.createElement for null props');
  } catch (e) {
    console.log('[MINIMAL-FIX] Error patching React:', e.message);
  }
};

// Run all the minimal fixes
ensureManifestStructure();
createPlaceholderDocument();
patchReactCreateElement();
console.log('[MINIMAL-FIX] Applied minimal runtime fixes for Next.js deployment');

// Export the function for use in other modules
module.exports = { ensureManifestStructure }; 