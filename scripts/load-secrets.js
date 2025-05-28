#!/usr/bin/env node

/**
 * Load secrets from mounted files in Choreo deployment
 * This script reads environment variables from files in /etc/secrets
 * and sets them as process environment variables
 */

const fs = require('fs');
const path = require('path');

function loadSecretsFromFiles() {
  const secretsPath = process.env.SECRETS_PATH || '/etc/secrets';
  
  console.log(`[SECRETS] Loading secrets from: ${secretsPath}`);
  
  if (!fs.existsSync(secretsPath)) {
    console.log(`[SECRETS] Secrets path does not exist: ${secretsPath}`);
    return;
  }
  
  try {
    const files = fs.readdirSync(secretsPath);
    console.log(`[SECRETS] Found files:`, files);
    
    for (const file of files) {
      const filePath = path.join(secretsPath, file);
      
      if (fs.statSync(filePath).isFile()) {
        try {
          const content = fs.readFileSync(filePath, 'utf8').trim();
          
          // Handle both key=value format and plain value format
          if (content.includes('=')) {
            // Parse key=value pairs from the file
            const lines = content.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('='); // Handle values with = in them
                
                if (key && value) {
                  process.env[key.trim()] = value.trim();
                  console.log(`[SECRETS] Loaded: ${key.trim()}=${value.trim().substring(0, 10)}...`);
                }
              }
            }
          } else {
            // Use filename as key, content as value
            const key = file.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            process.env[key] = content;
            console.log(`[SECRETS] Loaded: ${key}=${content.substring(0, 10)}...`);
          }
        } catch (error) {
          console.error(`[SECRETS] Error reading file ${file}:`, error.message);
        }
      }
    }
    
    // Verify critical secrets are loaded
    const criticalSecrets = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'DATABASE_URL'
    ];
    
    const missing = criticalSecrets.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.warn(`[SECRETS] Missing critical secrets:`, missing);
    } else {
      console.log(`[SECRETS] All critical secrets loaded successfully`);
    }
    
  } catch (error) {
    console.error(`[SECRETS] Error loading secrets:`, error.message);
  }
}

// Load secrets when this module is imported
loadSecretsFromFiles();

module.exports = { loadSecretsFromFiles }; 