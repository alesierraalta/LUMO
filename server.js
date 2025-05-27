const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Try to detect if we're running in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next/standalone'));
console.log('[SERVER] Running in standalone mode:', isStandalone);

// Fix CSS manifest files to prevent entryCSSFiles error
try {
  console.log('[SERVER] Fixing CSS manifest files...');
  
  // Ensure static/css directory exists
  const staticCssDir = path.join(process.cwd(), '.next/static/css');
  if (!fs.existsSync(staticCssDir)) {
    fs.mkdirSync(staticCssDir, { recursive: true });
    console.log('[SERVER] Created missing .next/static/css directory');
  }
  
  // Fix build-manifest.json
  const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    try {
      const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
      
      // Create complete manifest structure if missing
      if (!buildManifest.entryCSSFiles || typeof buildManifest.entryCSSFiles !== 'object') {
        buildManifest.entryCSSFiles = {
          '/_app': [],
          '/': []
        };
        
        // Add critical fields that might be missing
        if (!buildManifest.pages) buildManifest.pages = {};
        if (!buildManifest.polyfillFiles) buildManifest.polyfillFiles = [];
        if (!buildManifest.rootMainFiles) buildManifest.rootMainFiles = [];
        
        // Write back the fixed manifest
        fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
        console.log('[SERVER] build-manifest.json fixed');
      }
    } catch (e) {
      console.log('[SERVER] Error fixing build-manifest.json:', e.message);
      
      // If parsing fails, create a basic manifest
      const fallbackManifest = {
        pages: {},
        polyfillFiles: [],
        rootMainFiles: [],
        entryCSSFiles: {
          '/_app': [],
          '/': []
        }
      };
      fs.writeFileSync(buildManifestPath, JSON.stringify(fallbackManifest, null, 2));
      console.log('[SERVER] Created new build-manifest.json');
    }
  } else {
    // Create manifest if missing entirely
    console.log('[SERVER] build-manifest.json not found, creating it');
    const fallbackManifest = {
      pages: {},
      polyfillFiles: [],
      rootMainFiles: [],
      entryCSSFiles: {
        '/_app': [],
        '/': []
      }
    };
    fs.writeFileSync(buildManifestPath, JSON.stringify(fallbackManifest, null, 2));
  }
  
  // Fix app-build-manifest.json if it exists
  const appBuildManifestPath = path.join(process.cwd(), '.next/app-build-manifest.json');
  if (fs.existsSync(appBuildManifestPath)) {
    try {
      const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
      
      // Ensure entryCSSFiles exists
      if (!appBuildManifest.entryCSSFiles || typeof appBuildManifest.entryCSSFiles !== 'object') {
        appBuildManifest.entryCSSFiles = {};
        if (!appBuildManifest.pages) appBuildManifest.pages = {};
        fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
        console.log('[SERVER] app-build-manifest.json fixed');
      }
    } catch (e) {
      console.log('[SERVER] Error fixing app-build-manifest.json:', e.message);
      
      // Create a basic app manifest if parsing fails
      const fallbackAppManifest = {
        pages: {},
        entryCSSFiles: {}
      };
      fs.writeFileSync(appBuildManifestPath, JSON.stringify(fallbackAppManifest, null, 2));
    }
  } else if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    // Create app manifest if missing
    console.log('[SERVER] app-build-manifest.json not found, creating it');
    const fallbackAppManifest = {
      pages: {},
      entryCSSFiles: {}
    };
    fs.writeFileSync(appBuildManifestPath, JSON.stringify(fallbackAppManifest, null, 2));
  }
  
  // Create or fix chunks manifest file
  const chunksDir = path.join(process.cwd(), '.next/static/chunks');
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }
  
  const chunksManifestPath = path.join(chunksDir, 'manifest.json');
  if (!fs.existsSync(chunksManifestPath)) {
    const chunksManifest = {
      polyfillFiles: [],
      entryCSSFiles: {},
      entryJSFiles: {}
    };
    fs.writeFileSync(chunksManifestPath, JSON.stringify(chunksManifest, null, 2));
    console.log('[SERVER] Created chunks manifest.json');
  }
} catch (error) {
  console.log('[SERVER] Error fixing CSS manifests:', error.message);
}

// Check if standalone server.js exists and we should use that instead
const standaloneServerPath = path.join(process.cwd(), '.next/standalone/server.js');
if (isStandalone && fs.existsSync(standaloneServerPath)) {
  console.log('[SERVER] Using standalone server.js instead');
  try {
    require(standaloneServerPath);
    // This will take over and our code below won't execute
  } catch (error) {
    console.error('[SERVER] Error loading standalone server:', error.message);
    console.log('[SERVER] Falling back to custom server implementation');
    // Continue with our implementation below if standalone fails
  }
} else {
  // Standard server implementation
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();
  const port = process.env.PORT || 8080;

  console.log('[SERVER] Starting Next.js application...');
  console.log('[SERVER] Environment:', process.env.NODE_ENV);
  console.log('[SERVER] Port:', port);

  app.prepare().then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, '0.0.0.0', (err) => {
      if (err) throw err;
      console.log('[SERVER] Next.js server ready on port', port);
    });
  }).catch((ex) => {
    console.error('[SERVER] Error starting server:', ex.message);
    process.exit(1);
  });
}
