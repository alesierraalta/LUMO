#!/usr/bin/env node

/**
 * Runtime debugging script for Choreo deployment
 * Helps identify the source of Next.js standalone errors
 */

console.log('[DEBUG] Starting runtime debugging...');

// Check Node.js version
console.log('[DEBUG] Node.js version:', process.version);
console.log('[DEBUG] Platform:', process.platform);
console.log('[DEBUG] Architecture:', process.arch);

// Check environment variables
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] Port:', process.env.PORT);

// Check critical Clerk variables (first 10 chars only)
console.log('[DEBUG] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
console.log('[DEBUG] CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

// Check file system
const fs = require('fs');
const path = require('path');

console.log('[DEBUG] Current working directory:', process.cwd());

// Check critical Next.js standalone files
const criticalFiles = [
  'server.js',
  '.next/static',
  'public',
  'next.config.ts',
  'postcss.config.mjs'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`[DEBUG] ${file} exists:`, exists);
  if (exists && file === '.next/static') {
    try {
      const staticFiles = fs.readdirSync('.next/static');
      console.log(`[DEBUG] Files in .next/static:`, staticFiles.slice(0, 5)); // Show first 5
    } catch (e) {
      console.log(`[DEBUG] Error reading .next/static:`, e.message);
    }
  }
});

// Enhanced CSS manifest checks
try {
  if (fs.existsSync('.next')) {
    const nextFiles = fs.readdirSync('.next');
    console.log('[DEBUG] Files in .next (first 10):', nextFiles.slice(0, 10));
    
    // Look for manifest files
    const manifestFiles = nextFiles.filter(f => f.includes('manifest') || f.includes('css'));
    console.log('[DEBUG] Manifest/CSS files:', manifestFiles);
    
    // Check for required-server-files.json
    if (fs.existsSync('.next/required-server-files.json')) {
      try {
        const requiredFiles = JSON.parse(fs.readFileSync('.next/required-server-files.json', 'utf8'));
        console.log('[DEBUG] Required server files config exists');
        if (requiredFiles.files) {
          console.log('[DEBUG] Required files count:', requiredFiles.files.length);
        }
      } catch (e) {
        console.log('[DEBUG] Error reading required-server-files.json:', e.message);
      }
    } else {
      console.log('[DEBUG] required-server-files.json NOT found');
    }
    
    // Try to create missing CSS manifest if needed
    if (!fs.existsSync('.next/static/css')) {
      console.log('[DEBUG] Creating missing .next/static/css directory...');
      fs.mkdirSync('.next/static/css', { recursive: true });
    }
  }
} catch (error) {
  console.log('[DEBUG] Error reading .next directory:', error.message);
}

// Check package.json and dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('[DEBUG] App name:', packageJson.name);
  console.log('[DEBUG] App version:', packageJson.version);
  console.log('[DEBUG] Next.js version:', packageJson.dependencies?.['next'] || 'not found');
  console.log('[DEBUG] PostCSS available:', !!packageJson.dependencies?.['postcss']);
  console.log('[DEBUG] Tailwind available:', !!packageJson.dependencies?.['tailwindcss']);
} catch (error) {
  console.log('[DEBUG] Error reading package.json:', error.message);
}

// Check if we can import Next.js modules
try {
  console.log('[DEBUG] Testing Next.js import...');
  const nextPackage = require('next/package.json');
  console.log('[DEBUG] Next.js package version:', nextPackage.version);
} catch (error) {
  console.log('[DEBUG] Error importing Next.js:', error.message);
}

// Check for common CSS processing modules
const cssModules = ['postcss', 'tailwindcss', '@tailwindcss/postcss'];
cssModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`[DEBUG] ${module}: available`);
  } catch (e) {
    console.log(`[DEBUG] ${module}: NOT available`);
  }
});

// List current directory structure
try {
  const currentDirFiles = fs.readdirSync('.');
  console.log('[DEBUG] Current directory files:', currentDirFiles);
} catch (error) {
  console.log('[DEBUG] Error listing current directory:', error.message);
}

// Create CSS manifest fallback to prevent entryCSSFiles error
try {
  const manifestPath = '.next/static/chunks/manifest.json';
  if (!fs.existsSync(manifestPath)) {
    console.log('[DEBUG] Creating CSS manifest fallback...');
    const fallbackManifest = {
      entryCSSFiles: {},
      entryJSFiles: {},
      polyfillFiles: []
    };
    fs.writeFileSync(manifestPath, JSON.stringify(fallbackManifest, null, 2));
    console.log('[DEBUG] CSS manifest fallback created');
  }
} catch (error) {
  console.log('[DEBUG] Error creating CSS manifest fallback:', error.message);
}

console.log('[DEBUG] Debug complete. Starting application...'); 