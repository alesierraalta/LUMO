#!/usr/bin/env node

/**
 * CHOREO ENVIRONMENT VARIABLES CONFIGURATION GENERATOR
 * 
 * This script generates the exact configuration needed for Choreo deployment
 * with all the correct environment variable values.
 */

const fs = require('fs');
const path = require('path');

// Exact values needed for Choreo deployment
const CHOREO_ENV_VARS = {
  // Core Application
  'NODE_ENV': 'production',
  'APP_NAME': 'LUMO',
  'APP_VERSION': '1.0.0',
  
  // Choreo Specific
  'CHOREO_ENVIRONMENT': 'Production',
  'FORCE_SUPABASE': 'true',
  
  // Supabase Configuration (Client-side)
  'NEXT_PUBLIC_SUPABASE_URL': 'https://ubjujxtvlubxowsphvuk.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4',
  
  // Supabase Configuration (Server-side)
  'SUPABASE_URL': 'https://ubjujxtvlubxowsphvuk.supabase.co',
  'SUPABASE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMjM4NCwiZXhwIjoyMDY1MDg4Mzg0fQ.dBKGr8BqLGDSGAkCHnHI8FJQb-tTOaQ3gLHo_8rl4Eo',
  
  // Database
  'DATABASE_URL': 'postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
  
  // Authentication
  'JWT_SECRET': 'pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==',
  'NEXTAUTH_SECRET': 'pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==',
  'NEXTAUTH_URL': 'https://lumo-1615540597.choreoapis.dev'
};

// Variables that should be configured as secrets in Choreo
const SECRET_VARS = [
  'JWT_SECRET',
  'NEXTAUTH_SECRET', 
  'DATABASE_URL',
  'SUPABASE_KEY'
];

// Variables that can be regular environment variables
const ENV_VARS = [
  'NODE_ENV',
  'APP_NAME', 
  'APP_VERSION',
  'CHOREO_ENVIRONMENT',
  'FORCE_SUPABASE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'NEXTAUTH_URL'
];

function generateChoreoYamlConfig() {
  const envSection = ENV_VARS.map(key => `      ${key}: "${CHOREO_ENV_VARS[key]}"`).join('\n');
  
  return `# CHOREO DEPLOYMENT CONFIGURATION
# Copy these exact values to your choreo.yaml

deploy:
  env:
${envSection}
  
  # Secrets (configure these in Choreo Console -> Secrets)
  # ${SECRET_VARS.map(key => `${key}: "${CHOREO_ENV_VARS[key]}"`).join('\n  # ')}
`;
}

function generateChoreoConsoleConfig() {
  let config = `
═══════════════════════════════════════════════════════════════
🔧 CHOREO CONSOLE CONFIGURATION GUIDE
═══════════════════════════════════════════════════════════════

STEP 1: ENVIRONMENT VARIABLES (choreo.yaml or Console)
─────────────────────────────────────────────────────────────

`;

  ENV_VARS.forEach(key => {
    config += `${key}
Value: ${CHOREO_ENV_VARS[key]}
Description: ${getVariableDescription(key)}
────────────────────────────────────────────────────────────────

`;
  });

  config += `
STEP 2: SECRETS (Choreo Console -> Project -> Secrets)
─────────────────────────────────────────────────────────────

⚠️  IMPORTANT: These MUST be configured as secrets in Choreo Console!

`;

  SECRET_VARS.forEach(key => {
    config += `Secret Name: ${key}
Secret Value: ${CHOREO_ENV_VARS[key]}
Description: ${getVariableDescription(key)}
────────────────────────────────────────────────────────────────

`;
  });

  config += `
STEP 3: VERIFICATION
─────────────────────────────────────────────────────────────

After configuring all variables, access this URL to verify:
https://lumo-1615540597.choreoapis.dev/api/debug-env-config

This endpoint will show you:
✅ Which variables are correctly configured
🟡 Which variables contain placeholder text  
🔴 Which variables are missing
🟠 Which variables have incorrect values

═══════════════════════════════════════════════════════════════
`;

  return config;
}

function generateDotEnvFormat() {
  let content = `# PRODUCTION ENVIRONMENT VARIABLES FOR CHOREO
# Copy these exact values to your deployment

`;

  Object.entries(CHOREO_ENV_VARS).forEach(([key, value]) => {
    content += `${key}="${value}"\n`;
  });

  return content;
}

function getVariableDescription(key) {
  const descriptions = {
    'NODE_ENV': 'Application environment mode',
    'APP_NAME': 'Application name identifier',
    'APP_VERSION': 'Application version number',
    'CHOREO_ENVIRONMENT': 'Choreo deployment environment',
    'FORCE_SUPABASE': 'Force Supabase client usage',
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL (client-side)',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key (client-side)',
    'SUPABASE_URL': 'Supabase project URL (server-side)',
    'SUPABASE_KEY': 'Supabase service role key (server-side)',
    'DATABASE_URL': 'PostgreSQL connection string',
    'JWT_SECRET': 'JWT token signing secret',
    'NEXTAUTH_SECRET': 'NextAuth.js encryption secret',
    'NEXTAUTH_URL': 'NextAuth.js base URL'
  };
  
  return descriptions[key] || 'Application configuration variable';
}

function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Generate all configuration files
    const choreoYaml = generateChoreoYamlConfig();
    const consoleGuide = generateChoreoConsoleConfig();
    const dotEnv = generateDotEnvFormat();
    
    // Write files
    fs.writeFileSync(`CHOREO_CONFIG_${timestamp}.yaml`, choreoYaml);
    fs.writeFileSync(`CHOREO_CONSOLE_GUIDE_${timestamp}.txt`, consoleGuide);
    fs.writeFileSync(`CHOREO_ENV_VARS_${timestamp}.env`, dotEnv);
    
    console.log('🎯 CHOREO CONFIGURATION GENERATOR');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Generated configuration files:');
    console.log(`   📄 CHOREO_CONFIG_${timestamp}.yaml`);
    console.log(`   📋 CHOREO_CONSOLE_GUIDE_${timestamp}.txt`);
    console.log(`   🔧 CHOREO_ENV_VARS_${timestamp}.env`);
    console.log('');
    console.log('🔍 QUICK VERIFICATION:');
    console.log('   After deployment, visit: https://lumo-1615540597.choreoapis.dev/api/debug-env-config');
    console.log('');
    console.log('📋 CRITICAL VARIABLES TO CHECK:');
    console.log('   • NEXT_PUBLIC_SUPABASE_URL should be: https://ubjujxtvlubxowsphvuk.supabase.co');
    console.log('   • NEXT_PUBLIC_SUPABASE_ANON_KEY should start with: eyJhbGciOiJIUzI1NiIs...');
    console.log('   • JWT_SECRET should start with: pvkn4ZqUlFJ6/BRynEb+...');
    console.log('');
    console.log('⚠️  IMPORTANT: Make sure NO values contain placeholder text like:');
    console.log('   ❌ "your-project-id"');
    console.log('   ❌ "YOUR_SUPABASE_URL"'); 
    console.log('   ❌ "your_anon_key_here"');
    console.log('');
    console.log('🚀 Ready for deployment!');
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error generating configuration:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
} 