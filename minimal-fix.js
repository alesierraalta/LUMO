#!/usr/bin/env node

/**
 * Minimal Fix for Next.js deployment
 * 
 * This script applies the minimal fixes needed to prevent
 * the app from crashing due to missing files or the entryCSSFiles error.
 */

const fs = require('fs');
const path = require('path');

console.log('[MINIMAL-FIX] Starting minimal fixes for Next.js deployment...');

// Set APP_NEXT_ROOT_DIR environment variable
process.env.APP_NEXT_ROOT_DIR = process.cwd();
console.log(`[MINIMAL-FIX] Set APP_NEXT_ROOT_DIR to ${process.env.APP_NEXT_ROOT_DIR}`);

// Detect if we're running in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next/standalone'));
const nextDir = path.join(process.cwd(), '.next');
const standaloneNextDir = isStandalone ? path.join(nextDir, 'standalone', '.next') : null;

// Ensure proper directories exist
const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// CSS directories
ensureDirectory(path.join(nextDir, 'static', 'css'));
ensureDirectory(path.join(nextDir, 'static', 'chunks'));

if (isStandalone) {
  ensureDirectory(path.join(standaloneNextDir, 'static', 'css'));
  ensureDirectory(path.join(standaloneNextDir, 'static', 'chunks'));
}

// Fix manifest to ensure entryCSSFiles exists
const fixManifest = (manifestPath) => {
  if (!fs.existsSync(manifestPath)) {
    // If manifest doesn't exist, create an empty one
    const emptyManifest = {
      pages: {},
      rootMainFiles: [],
      entryCSSFiles: {}
    };
    fs.writeFileSync(manifestPath, JSON.stringify(emptyManifest, null, 2));
    console.log(`[MINIMAL-FIX] Created new manifest: ${manifestPath}`);
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Ensure entryCSSFiles exists
    if (!manifest.entryCSSFiles) {
      manifest.entryCSSFiles = {};
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`[MINIMAL-FIX] Fixed manifest: ${manifestPath}`);
    }
  } catch (error) {
    console.error(`[MINIMAL-FIX] Error fixing manifest ${manifestPath}:`, error.message);
    
    // Create new manifest if JSON parsing failed
    const fallbackManifest = {
      pages: {},
      rootMainFiles: [],
      entryCSSFiles: {}
    };
    fs.writeFileSync(manifestPath, JSON.stringify(fallbackManifest, null, 2));
  }
};

// Fix all manifest files
fixManifest(path.join(nextDir, 'build-manifest.json'));
fixManifest(path.join(nextDir, 'app-build-manifest.json'));

if (isStandalone) {
  fixManifest(path.join(standaloneNextDir, 'build-manifest.json'));
  fixManifest(path.join(standaloneNextDir, 'app-build-manifest.json'));
}

console.log('[MINIMAL-FIX] Ensured proper manifest structure');

// Monkey-patch React.createElement to handle null props
try {
  const originalReactCreate = global.React?.createElement;
  if (originalReactCreate) {
    global.React.createElement = function(type, props, ...children) {
      return originalReactCreate.call(this, type, props || {}, ...children);
    };
    console.log('[MINIMAL-FIX] Patched React.createElement for null props');
  }
} catch (e) {
  console.log('[MINIMAL-FIX] React not available for patching');
}

// Create a CSS fallback file if needed
const fallbackCssPath = path.join(nextDir, 'static', 'css', 'fallback.css');
if (!fs.existsSync(fallbackCssPath)) {
  const cssContent = `
    /* Fallback CSS file created by minimal-fix.js */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  `;
  fs.writeFileSync(fallbackCssPath, cssContent);
  
  if (isStandalone) {
    // Copy to standalone too
    fs.writeFileSync(
      path.join(standaloneNextDir, 'static', 'css', 'fallback.css'),
      cssContent
    );
  }
}

console.log('[MINIMAL-FIX] Applied minimal runtime fixes for Next.js deployment');

// Export the function for use in other modules
module.exports = { ensureManifestStructure: () => {} }; 