#!/usr/bin/env node

/**
 * Runtime debugging script for Choreo deployment
 * Helps identify the source of the clientModules error
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
console.log('[DEBUG] .next directory exists:', fs.existsSync('.next'));
console.log('[DEBUG] .next/standalone directory exists:', fs.existsSync('.next/standalone'));
console.log('[DEBUG] server.js exists:', fs.existsSync('.next/standalone/server.js'));

// List files in .next directory
try {
  const nextFiles = fs.readdirSync('.next');
  console.log('[DEBUG] Files in .next:', nextFiles);
} catch (error) {
  console.log('[DEBUG] Error reading .next directory:', error.message);
}

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('[DEBUG] App name:', packageJson.name);
  console.log('[DEBUG] App version:', packageJson.version);
  console.log('[DEBUG] Next.js version:', packageJson.dependencies?.['next'] || 'not found');
} catch (error) {
  console.log('[DEBUG] Error reading package.json:', error.message);
}

// Try to import and check Next.js modules
try {
  console.log('[DEBUG] Attempting to require Next.js...');
  const nextPackage = require('next/package.json');
  console.log('[DEBUG] Next.js package version:', nextPackage.version);
} catch (error) {
  console.log('[DEBUG] Error requiring Next.js:', error.message);
}

console.log('[DEBUG] Debug complete. Starting application...'); 