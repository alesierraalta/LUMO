#!/usr/bin/env node

/**
 * Manifest Validator and Repair System
 * 
 * Ensures all Next.js build manifests have proper structure,
 * especially the entryCSSFiles property that causes runtime errors.
 */

const fs = require('fs');
const path = require('path');

class ManifestValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.nextDir = path.join(this.rootDir, '.next');
    this.isStandalone = fs.existsSync(path.join(this.nextDir, 'standalone'));
    this.standaloneNextDir = this.isStandalone ? path.join(this.nextDir, 'standalone', '.next') : null;
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [MANIFEST-VALIDATOR] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    if (level === 'error') {
      this.errors.push({ message, data });
    } else if (level === 'warn') {
      this.warnings.push({ message, data });
    } else if (level === 'fix') {
      this.fixes.push({ message, data });
    }
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.log('fix', `Created directory: ${dirPath}`);
      return true;
    }
    return false;
  }

  validateManifestStructure(manifest, manifestType) {
    const issues = [];
    
    // Check for required properties
    if (!manifest.hasOwnProperty('entryCSSFiles')) {
      issues.push('Missing entryCSSFiles property');
    } else if (typeof manifest.entryCSSFiles !== 'object' || manifest.entryCSSFiles === null) {
      issues.push('entryCSSFiles must be an object');
    }

    if (manifestType === 'build') {
      if (!manifest.polyfillFiles || !Array.isArray(manifest.polyfillFiles)) {
        issues.push('Missing or invalid polyfillFiles array');
      }
      if (!manifest.pages || typeof manifest.pages !== 'object') {
        issues.push('Missing or invalid pages object');
      }
      if (!manifest.hasOwnProperty('rootMainFiles')) {
        issues.push('Missing rootMainFiles property');
      }
    }

    if (manifestType === 'app') {
      if (!manifest.pages || typeof manifest.pages !== 'object') {
        issues.push('Missing or invalid pages object');
      }
    }

    return issues;
  }

  repairManifest(manifest, manifestType) {
    let repaired = false;
    const repairedManifest = { ...manifest };

    // Ensure entryCSSFiles exists and is properly structured
    if (!repairedManifest.entryCSSFiles || typeof repairedManifest.entryCSSFiles !== 'object') {
      repairedManifest.entryCSSFiles = {};
      repaired = true;
    }

    // Add fallback CSS files if pages exist but no CSS entries
    if (repairedManifest.pages && typeof repairedManifest.pages === 'object') {
      const pageKeys = Object.keys(repairedManifest.pages);
      pageKeys.forEach(pageKey => {
        if (!repairedManifest.entryCSSFiles[pageKey]) {
          repairedManifest.entryCSSFiles[pageKey] = ['/static/css/fallback.css'];
          repaired = true;
        }
      });
    }

    // Add default CSS entry for root page
    if (!repairedManifest.entryCSSFiles['/']) {
      repairedManifest.entryCSSFiles['/'] = ['/static/css/app.css', '/static/css/globals.css'];
      repaired = true;
    }

    if (manifestType === 'build') {
      // Ensure required build manifest properties
      if (!repairedManifest.polyfillFiles) {
        repairedManifest.polyfillFiles = ['static/chunks/polyfills.js'];
        repaired = true;
      }
      if (!repairedManifest.pages) {
        repairedManifest.pages = { '/_app': [] };
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('rootMainFiles')) {
        repairedManifest.rootMainFiles = [];
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('devFiles')) {
        repairedManifest.devFiles = [];
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('ampDevFiles')) {
        repairedManifest.ampDevFiles = [];
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('lowPriorityFiles')) {
        repairedManifest.lowPriorityFiles = [];
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('rootMainFilesTree')) {
        repairedManifest.rootMainFilesTree = {};
        repaired = true;
      }
      if (!repairedManifest.hasOwnProperty('ampFirstPages')) {
        repairedManifest.ampFirstPages = [];
        repaired = true;
      }
    }

    if (manifestType === 'app') {
      // Ensure required app manifest properties
      if (!repairedManifest.pages) {
        repairedManifest.pages = {};
        repaired = true;
      }
    }

    return { manifest: repairedManifest, repaired };
  }

  validateAndRepairManifest(manifestPath, manifestType) {
    this.log('info', `Validating manifest: ${manifestPath}`);

    if (!fs.existsSync(manifestPath)) {
      this.log('warn', `Manifest file does not exist: ${manifestPath}`);
      
      // Create default manifest
      const defaultManifest = this.createDefaultManifest(manifestType);
      fs.writeFileSync(manifestPath, JSON.stringify(defaultManifest, null, 2));
      this.log('fix', `Created default manifest: ${manifestPath}`);
      return true;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      let manifest;
      
      try {
        manifest = JSON.parse(manifestContent);
      } catch (parseError) {
        this.log('error', `Failed to parse manifest JSON: ${manifestPath}`, parseError.message);
        
        // Create new manifest if JSON is corrupted
        const defaultManifest = this.createDefaultManifest(manifestType);
        fs.writeFileSync(manifestPath, JSON.stringify(defaultManifest, null, 2));
        this.log('fix', `Replaced corrupted manifest: ${manifestPath}`);
        return true;
      }

      // Validate structure
      const issues = this.validateManifestStructure(manifest, manifestType);
      
      if (issues.length > 0) {
        this.log('warn', `Manifest validation issues found in ${manifestPath}:`, issues);
        
        // Repair manifest
        const { manifest: repairedManifest, repaired } = this.repairManifest(manifest, manifestType);
        
        if (repaired) {
          fs.writeFileSync(manifestPath, JSON.stringify(repairedManifest, null, 2));
          this.log('fix', `Repaired manifest: ${manifestPath}`);
          return true;
        }
      }

      this.log('info', `Manifest validation passed: ${manifestPath}`);
      return true;

    } catch (error) {
      this.log('error', `Error processing manifest ${manifestPath}:`, error.message);
      return false;
    }
  }

  createDefaultManifest(type) {
    if (type === 'build') {
      return {
        polyfillFiles: ['static/chunks/polyfills.js'],
        devFiles: [],
        ampDevFiles: [],
        lowPriorityFiles: [],
        rootMainFiles: [],
        rootMainFilesTree: {},
        pages: {
          '/_app': [],
          '/': []
        },
        entryCSSFiles: {
          '/': ['/static/css/app.css', '/static/css/globals.css'],
          '/_app': ['/static/css/app.css']
        },
        ampFirstPages: []
      };
    }

    if (type === 'app') {
      return {
        pages: {
          '/': [],
          '/layout': []
        },
        entryCSSFiles: {
          '/': ['/static/css/app.css', '/static/css/globals.css'],
          '/layout': ['/static/css/app.css']
        }
      };
    }

    return {};
  }

  createFallbackCSSFiles() {
    this.log('info', 'Creating fallback CSS files...');

    const cssDirectories = [
      path.join(this.nextDir, 'static', 'css'),
      path.join(this.nextDir, 'static', 'chunks')
    ];

    if (this.isStandalone) {
      cssDirectories.push(
        path.join(this.standaloneNextDir, 'static', 'css'),
        path.join(this.standaloneNextDir, 'static', 'chunks')
      );
    }

    // Ensure directories exist
    cssDirectories.forEach(dir => this.ensureDirectory(dir));

    // Create fallback CSS content
    const fallbackCSS = `
/* Fallback CSS - Generated by Manifest Validator */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

.error-boundary {
  padding: 20px;
  margin: 20px;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  background-color: #ffe6e6;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
`;

    const appCSS = `
/* App-specific CSS - Generated by Manifest Validator */
@import './globals.css';

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
`;

    // Write CSS files
    const cssFiles = [
      { path: path.join(this.nextDir, 'static', 'css', 'fallback.css'), content: fallbackCSS },
      { path: path.join(this.nextDir, 'static', 'css', 'app.css'), content: appCSS },
      { path: path.join(this.nextDir, 'static', 'css', 'globals.css'), content: fallbackCSS }
    ];

    if (this.isStandalone) {
      cssFiles.push(
        { path: path.join(this.standaloneNextDir, 'static', 'css', 'fallback.css'), content: fallbackCSS },
        { path: path.join(this.standaloneNextDir, 'static', 'css', 'app.css'), content: appCSS },
        { path: path.join(this.standaloneNextDir, 'static', 'css', 'globals.css'), content: fallbackCSS }
      );
    }

    cssFiles.forEach(({ path: filePath, content }) => {
      fs.writeFileSync(filePath, content);
      this.log('fix', `Created CSS file: ${filePath}`);
    });
  }

  async validate() {
    this.log('info', 'Starting manifest validation and repair process...');
    this.log('info', `Working directory: ${this.rootDir}`);
    this.log('info', `Standalone mode: ${this.isStandalone}`);

    // Ensure CSS directories exist
    this.createFallbackCSSFiles();

    // Validate and repair manifests
    const manifests = [
      { path: path.join(this.nextDir, 'build-manifest.json'), type: 'build' },
      { path: path.join(this.nextDir, 'app-build-manifest.json'), type: 'app' }
    ];

    if (this.isStandalone) {
      manifests.push(
        { path: path.join(this.standaloneNextDir, 'build-manifest.json'), type: 'build' },
        { path: path.join(this.standaloneNextDir, 'app-build-manifest.json'), type: 'app' }
      );
    }

    let allValid = true;
    for (const { path: manifestPath, type } of manifests) {
      const isValid = this.validateAndRepairManifest(manifestPath, type);
      if (!isValid) {
        allValid = false;
      }
    }

    // Summary
    this.log('info', 'Validation summary:', {
      errors: this.errors.length,
      warnings: this.warnings.length,
      fixes: this.fixes.length,
      overall: allValid ? 'PASSED' : 'FAILED'
    });

    if (this.errors.length > 0) {
      this.log('error', 'Validation errors:', this.errors);
    }

    return allValid;
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ManifestValidator();
  validator.validate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('[MANIFEST-VALIDATOR] Fatal error:', error);
      process.exit(1);
    });
}

module.exports = ManifestValidator; 