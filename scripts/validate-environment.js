#!/usr/bin/env node

/**
 * Environment Validation Script
 * ============================
 * Validates environment configuration and prevents cross-environment access
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorMap = {
      error: colors.red,
      warning: colors.yellow,
      success: colors.green,
      info: colors.blue
    };
    
    const color = colorMap[type] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'info') this.info.push(message);
  }

  async validateEnvironment() {
    this.log('🔍 Starting Environment Validation...', 'info');
    
    // Check if environment files exist
    this.validateEnvironmentFiles();
    
    // Load and validate current environment
    const currentEnv = this.loadCurrentEnvironment();
    if (!currentEnv) {
      this.log('❌ Failed to load current environment', 'error');
      return false;
    }
    
    // Validate environment configuration
    this.validateEnvironmentConfiguration(currentEnv);
    
    // Check for production safety
    this.validateProductionSafety(currentEnv);
    
    // Check for development safety
    this.validateDevelopmentSafety(currentEnv);
    
    // Validate Supabase configuration
    this.validateSupabaseConfiguration(currentEnv);
    
    // Generate report
    this.generateReport(currentEnv);
    
    return this.errors.length === 0;
  }

  validateEnvironmentFiles() {
    this.log('📁 Checking environment files...', 'info');
    
    const requiredFiles = [
      '.env.example',
      '.env.development'
    ];
    
    const optionalFiles = [
      '.env.local',
      '.env.production'
    ];
    
    // Check required files
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.log(`❌ Missing required file: ${file}`, 'error');
      } else {
        this.log(`✅ Found required file: ${file}`, 'success');
      }
    }
    
    // Check optional files
    for (const file of optionalFiles) {
      if (fs.existsSync(file)) {
        this.log(`✅ Found optional file: ${file}`, 'success');
      } else {
        this.log(`⚠️  Optional file not found: ${file}`, 'warning');
      }
    }
    
    // Check for potential security issues
    if (fs.existsSync('.env')) {
      this.log('⚠️  Found .env file - consider using .env.local or .env.development', 'warning');
    }
  }

  loadCurrentEnvironment() {
    this.log('📋 Loading current environment configuration...', 'info');
    
    try {
      // Try to load from .env.local first, then .env.development
      let envFile = '.env.local';
      if (!fs.existsSync(envFile)) {
        envFile = '.env.development';
      }
      
      if (!fs.existsSync(envFile)) {
        this.log(`❌ No environment file found (checked ${envFile})`, 'error');
        return null;
      }
      
      const envContent = fs.readFileSync(envFile, 'utf8');
      const env = this.parseEnvFile(envContent);
      
      this.log(`✅ Loaded environment from: ${envFile}`, 'success');
      return env;
    } catch (error) {
      this.log(`❌ Failed to load environment: ${error.message}`, 'error');
      return null;
    }
  }

  parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        env[key.trim()] = value;
      }
    }
    
    return env;
  }

  validateEnvironmentConfiguration(env) {
    this.log('🔧 Validating environment configuration...', 'info');
    
    const requiredVars = [
      'NODE_ENV',
      'APP_ENVIRONMENT',
      'ENVIRONMENT_NAME',
      'SAFETY_CHECK_ENVIRONMENT',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    for (const varName of requiredVars) {
      if (!env[varName]) {
        this.log(`❌ Missing required environment variable: ${varName}`, 'error');
      } else {
        this.log(`✅ Found required variable: ${varName}`, 'success');
      }
    }
    
    // Check environment consistency
    if (env.NODE_ENV !== env.APP_ENVIRONMENT) {
      this.log(`⚠️  Environment mismatch: NODE_ENV=${env.NODE_ENV}, APP_ENVIRONMENT=${env.APP_ENVIRONMENT}`, 'warning');
    }
    
    if (env.SAFETY_CHECK_ENVIRONMENT !== env.APP_ENVIRONMENT) {
      this.log(`❌ Safety check failed: SAFETY_CHECK_ENVIRONMENT=${env.SAFETY_CHECK_ENVIRONMENT} != APP_ENVIRONMENT=${env.APP_ENVIRONMENT}`, 'error');
    }
  }

  validateProductionSafety(env) {
    if (env.APP_ENVIRONMENT !== 'production') return;
    
    this.log('🔒 Validating production safety...', 'info');
    
    // Check for localhost URLs
    if (env.NEXTAUTH_URL && env.NEXTAUTH_URL.includes('localhost')) {
      this.log('❌ Production environment cannot use localhost URLs', 'error');
    }
    
    // Check for development mode
    if (env.DEVELOPMENT_MODE === 'true') {
      this.log('❌ Production environment cannot have DEVELOPMENT_MODE=true', 'error');
    }
    
    // Check for production safety check
    if (env.PRODUCTION_SAFETY_CHECK !== 'enabled') {
      this.log('❌ Production environment requires PRODUCTION_SAFETY_CHECK=enabled', 'error');
    }
    
    // Check for production-like credentials
    if (env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL.includes('prod') && !env.NEXT_PUBLIC_SUPABASE_URL.includes('production')) {
      this.log('⚠️  Production Supabase URL should contain "prod" or "production"', 'warning');
    }
  }

  validateDevelopmentSafety(env) {
    if (env.APP_ENVIRONMENT !== 'development') return;
    
    this.log('🔧 Validating development safety...', 'info');
    
    // Check for localhost URLs
    if (env.NEXTAUTH_URL && !env.NEXTAUTH_URL.includes('localhost') && !env.NEXTAUTH_URL.includes('127.0.0.1')) {
      this.log('⚠️  Development environment should use localhost URLs', 'warning');
    }
    
    // Check for production URLs
    if (env.NEXT_PUBLIC_SUPABASE_URL && (env.NEXT_PUBLIC_SUPABASE_URL.includes('prod') || env.NEXT_PUBLIC_SUPABASE_URL.includes('production'))) {
      this.log('❌ Development environment detected production Supabase URL', 'error');
    }
    
    if (env.DATABASE_URL && (env.DATABASE_URL.includes('prod') || env.DATABASE_URL.includes('production'))) {
      this.log('❌ Development environment detected production database URL', 'error');
    }
  }

  validateSupabaseConfiguration(env) {
    this.log('🔗 Validating Supabase configuration...', 'info');
    
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.DATABASE_URL) {
      this.log('❌ Missing Supabase configuration', 'error');
      return;
    }
    
    // Extract project IDs
    const urlMatch = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
    const dbMatch = env.DATABASE_URL.match(/postgres\.([^:]+):/);
    
    if (!urlMatch || !dbMatch) {
      this.log('❌ Invalid Supabase URL format', 'error');
      return;
    }
    
    const urlProjectId = urlMatch[1];
    const dbProjectId = dbMatch[1];
    
    if (urlProjectId !== dbProjectId) {
      this.log(`❌ Supabase project ID mismatch: URL=${urlProjectId}, DB=${dbProjectId}`, 'error');
    } else {
      this.log(`✅ Supabase project IDs match: ${urlProjectId}`, 'success');
    }
    
    // Check key formats
    if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
      this.log('❌ Invalid Supabase anon key format', 'error');
    }
    
    if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
      this.log('❌ Invalid Supabase service role key format', 'error');
    }
  }

  generateReport(env) {
    this.log('📊 Generating validation report...', 'info');
    
    console.log(`\n${colors.bright}Environment Validation Report${colors.reset}`);
    console.log(`${colors.bright}================================${colors.reset}`);
    console.log(`Environment: ${colors.cyan}${env.ENVIRONMENT_NAME || 'Unknown'}${colors.reset}`);
    console.log(`Type: ${colors.cyan}${env.APP_ENVIRONMENT || 'Unknown'}${colors.reset}`);
    console.log(`Timestamp: ${colors.cyan}${new Date().toISOString()}${colors.reset}`);
    
    console.log(`\n${colors.bright}Results Summary:${colors.reset}`);
    console.log(`${colors.red}❌ Errors: ${this.errors.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.blue}ℹ️  Info: ${this.info.length}${colors.reset}`);
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bright}Critical Issues:${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`${colors.red}${index + 1}. ${error}${colors.reset}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`${colors.yellow}${index + 1}. ${warning}${colors.reset}`);
      });
    }
    
    console.log(`\n${colors.bright}Validation Status:${colors.reset}`);
    if (this.errors.length === 0) {
      console.log(`${colors.green}✅ PASSED - Environment is properly configured${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ FAILED - ${this.errors.length} critical issue(s) found${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    if (this.errors.length > 0) {
      console.log(`${colors.red}1. Fix all critical issues listed above${colors.reset}`);
      console.log(`${colors.yellow}2. Re-run validation: npm run validate:env${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Environment validation passed - you're ready to go!${colors.reset}`);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validateEnvironment().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentValidator;