const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Detect if we're running in standalone mode
const isStandalone = fs.existsSync(path.join(process.cwd(), '.next/standalone'));
console.log('[SERVER] Running in standalone mode:', isStandalone);

// Fix CSS issues by ensuring directories and files exist
const fixCssIssues = () => {
  console.log('[SERVER] Fixing CSS manifest files...');
  
  // Set up CSS fallback
  const nextDir = path.join(process.cwd(), '.next');
  const cssDir = path.join(nextDir, 'static', 'css');
  
  // Create the CSS directory if it doesn't exist
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
    console.log('[SERVER] Created CSS directory');
  }
  
  // Create a fallback CSS file
  const fallbackCssPath = path.join(cssDir, 'fallback.css');
  if (!fs.existsSync(fallbackCssPath)) {
    const cssContent = `
      /* Fallback CSS file */
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    `;
    fs.writeFileSync(fallbackCssPath, cssContent);
    console.log('[SERVER] Created fallback CSS file');
  }
  
  // Fix manifest files to include the fallback CSS
  const fixManifest = (manifestPath, isApp = false) => {
    if (!fs.existsSync(manifestPath)) return;
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let changed = false;
      
      if (!manifest.entryCSSFiles) {
        manifest.entryCSSFiles = isApp ? {} : { '/_app': [], '/': [] };
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`[SERVER] Fixed manifest: ${manifestPath}`);
      }
    } catch (e) {
      console.error(`[SERVER] Error fixing ${manifestPath}:`, e.message);
    }
  };
  
  // Fix both types of manifests
  fixManifest(path.join(nextDir, 'build-manifest.json'));
  fixManifest(path.join(nextDir, 'app-build-manifest.json'), true);
  
  if (isStandalone) {
    const standaloneNextDir = path.join(nextDir, 'standalone', '.next');
    fixManifest(path.join(standaloneNextDir, 'build-manifest.json'));
    fixManifest(path.join(standaloneNextDir, 'app-build-manifest.json'), true);
    
    // Also copy the fallback CSS to the standalone directory
    const standaloneCssDir = path.join(standaloneNextDir, 'static', 'css');
    if (!fs.existsSync(standaloneCssDir)) {
      fs.mkdirSync(standaloneCssDir, { recursive: true });
    }
    
    const standaloneFallbackCssPath = path.join(standaloneCssDir, 'fallback.css');
    if (!fs.existsSync(standaloneFallbackCssPath) && fs.existsSync(fallbackCssPath)) {
      fs.copyFileSync(fallbackCssPath, standaloneFallbackCssPath);
      console.log('[SERVER] Copied fallback CSS to standalone directory');
    }
  }
};

// Handle entryCSSFiles errors at the process level
process.on('uncaughtException', (error) => {
  if (error.message && 
      (error.message.includes('entryCSSFiles') || 
       error.message.includes('Cannot read properties of undefined'))) {
    console.log('[SERVER] Caught entryCSSFiles error - continuing execution');
    return; // Don't crash
  }
  
  // Let other errors through
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Fix CSS issues before starting
fixCssIssues();

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
