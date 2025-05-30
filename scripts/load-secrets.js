#!/usr/bin/env node

/**
 * Load secrets for LUMO Inventory
 * Loads environment variables and secrets for development and production
 * Updated for custom JWT authentication (no Clerk)
 */

const fs = require('fs');
const path = require('path');

console.log('[LOAD-SECRETS] 🔐 Loading secrets for LUMO Inventory...');

// Required environment variables
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET'
];

// Optional environment variables
const OPTIONAL_VARS = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_VERSION'
];

// Load environment files
function loadEnvFiles() {
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`[LOAD-SECRETS] 📄 Loading ${envFile}...`);
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            if (key && value && !process.env[key.trim()]) {
              process.env[key.trim()] = value.trim();
            }
          }
        });
        
        console.log(`[LOAD-SECRETS] ✅ Loaded ${envFile}`);
      } catch (error) {
        console.log(`[LOAD-SECRETS] ⚠️ Error loading ${envFile}:`, error.message);
      }
    }
  });
}

// Validate loaded secrets
function validateSecrets() {
  console.log('[LOAD-SECRETS] 🔍 Validating secrets...');
  
  const missing = [];
  const present = [];
  
  REQUIRED_VARS.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  OPTIONAL_VARS.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    }
  });
  
  console.log('[LOAD-SECRETS] Present variables:', present);
  
  if (missing.length > 0) {
    console.error('[LOAD-SECRETS] ❌ Missing required variables:', missing);
    return false;
  }
  
  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.warn('[LOAD-SECRETS] ⚠️ DATABASE_URL should start with postgresql:// or postgres://');
  }
  
  // Validate JWT_SECRET length
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.error('[LOAD-SECRETS] ❌ JWT_SECRET must be at least 32 characters long');
    return false;
  }
  
  console.log('[LOAD-SECRETS] ✅ All secrets validated successfully');
  return true;
}

// Load from external secret files (if they exist)
function loadExternalSecrets() {
  const secretFiles = [
    '/run/secrets/database_url',
    '/run/secrets/jwt_secret',
    '/var/secrets/database_url',
    '/var/secrets/jwt_secret'
  ];
  
  secretFiles.forEach(secretFile => {
    if (fs.existsSync(secretFile)) {
      try {
        const content = fs.readFileSync(secretFile, 'utf8').trim();
        const filename = path.basename(secretFile);
        
        // Map file names to environment variable names
        const varName = filename.toUpperCase().replace(/_/g, '_');
        
        if (!process.env[varName] && content) {
          process.env[varName] = content;
          console.log(`[LOAD-SECRETS] 📁 Loaded ${varName} from ${secretFile}`);
        }
      } catch (error) {
        console.log(`[LOAD-SECRETS] ⚠️ Could not load ${secretFile}:`, error.message);
      }
    }
  });
}

// Main function
function loadSecrets() {
  console.log('[LOAD-SECRETS] 🚀 Starting secret loading process...');
  
  // Load from .env files
  loadEnvFiles();
  
  // Load from external secret files (Docker/Kubernetes style)
  loadExternalSecrets();
  
  // Validate all secrets
  const isValid = validateSecrets();
  
  if (isValid) {
    console.log('[LOAD-SECRETS] 🎉 All secrets loaded and validated successfully!');
    return true;
  } else {
    console.error('[LOAD-SECRETS] ❌ Secret validation failed!');
    return false;
  }
}

// Export for use in other scripts
module.exports = {
  loadSecrets,
  validateSecrets,
  REQUIRED_VARS,
  OPTIONAL_VARS
};

// Run if called directly
if (require.main === module) {
  const success = loadSecrets();
  process.exit(success ? 0 : 1);
} 