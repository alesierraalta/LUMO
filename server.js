const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Fix CSS manifest files to prevent entryCSSFiles error
try {
  console.log('[SERVER] Fixing CSS manifest files...');
  
  // Fix build-manifest.json
  const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    try {
      const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
      
      // Ensure entryCSSFiles exists and has proper structure
      if (!buildManifest.entryCSSFiles || typeof buildManifest.entryCSSFiles !== 'object') {
        buildManifest.entryCSSFiles = {
          '/_app': [],
          '/': []
        };
        // Write back the fixed manifest
        fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
        console.log('[SERVER] build-manifest.json fixed');
      }
    } catch (e) {
      console.log('[SERVER] Error fixing build-manifest.json:', e.message);
    }
  }
  
  // Fix app-build-manifest.json if it exists
  const appBuildManifestPath = path.join(process.cwd(), '.next/app-build-manifest.json');
  if (fs.existsSync(appBuildManifestPath)) {
    try {
      const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
      
      // Ensure entryCSSFiles exists
      if (!appBuildManifest.entryCSSFiles || typeof appBuildManifest.entryCSSFiles !== 'object') {
        appBuildManifest.entryCSSFiles = {};
        fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
        console.log('[SERVER] app-build-manifest.json fixed');
      }
    } catch (e) {
      console.log('[SERVER] Error fixing app-build-manifest.json:', e.message);
    }
  }
} catch (error) {
  console.log('[SERVER] Error fixing CSS manifests:', error.message);
}

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
