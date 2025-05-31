#!/usr/bin/env node

/**
 * Database Configuration Validator
 * Validates consistency between DATABASE_URL and Prisma schema provider
 * Ensures proper configuration for both development and production environments
 */

const fs = require('fs');
const path = require('path');

console.log('[DB VALIDATOR] 🔍 Starting database configuration validation...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Parse DATABASE_URL to determine database type
const parseDatabaseUrl = (url) => {
  if (!url) {
    return { type: 'none', valid: false, message: 'DATABASE_URL not set' };
  }

  if (url.startsWith('file:')) {
    return { 
      type: 'sqlite', 
      valid: true, 
      message: 'SQLite database (file-based)',
      connection: url
    };
  }

  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return { 
      type: 'postgresql', 
      valid: true, 
      message: 'PostgreSQL database',
      connection: url.replace(/\/\/.*:.*@/, '//[credentials]@')
    };
  }

  return { 
    type: 'unknown', 
    valid: false, 
    message: `Unsupported database URL format: ${url.substring(0, 20)}...`
  };
};

// Parse Prisma schema to get provider
const parseSchemaProvider = () => {
  if (!fs.existsSync(schemaPath)) {
    return { 
      provider: 'none', 
      valid: false, 
      message: 'schema.prisma not found' 
    };
  }

  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const providerMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
    
    if (!providerMatch) {
      return { 
        provider: 'unknown', 
        valid: false, 
        message: 'No provider found in schema.prisma' 
      };
    }

    return { 
      provider: providerMatch[1], 
      valid: true, 
      message: `Schema configured for ${providerMatch[1]}` 
    };
  } catch (error) {
    return { 
      provider: 'error', 
      valid: false, 
      message: `Error reading schema: ${error.message}` 
    };
  }
};

// Detect current environment
const detectEnvironment = () => {
  const indicators = {
    nodeEnv: process.env.NODE_ENV,
    choreoDeployment: process.env.CHOREO_DEPLOYMENT,
    databaseUrl: process.env.DATABASE_URL
  };

  const isProduction = 
    indicators.nodeEnv === 'production' ||
    indicators.choreoDeployment === 'true' ||
    (indicators.databaseUrl && indicators.databaseUrl.includes('postgres'));

  return {
    type: isProduction ? 'production' : 'development',
    indicators
  };
};

// Validate configuration consistency
const validateConsistency = (dbInfo, schemaInfo, environment) => {
  const issues = [];
  const warnings = [];

  // Check if both are valid
  if (!dbInfo.valid) {
    issues.push(`Database URL issue: ${dbInfo.message}`);
  }

  if (!schemaInfo.valid) {
    issues.push(`Schema issue: ${schemaInfo.message}`);
  }

  // If both are valid, check consistency
  if (dbInfo.valid && schemaInfo.valid) {
    if (dbInfo.type !== schemaInfo.provider) {
      issues.push(
        `MISMATCH: Database URL is ${dbInfo.type} but schema provider is ${schemaInfo.provider}`
      );
    }

    // Environment-specific validations
    if (environment.type === 'production') {
      if (schemaInfo.provider === 'sqlite') {
        issues.push('Production environment should not use SQLite');
      }
      if (dbInfo.type === 'sqlite') {
        issues.push('Production environment should not use SQLite database URL');
      }
    }

    if (environment.type === 'development') {
      if (schemaInfo.provider === 'postgresql' && dbInfo.type === 'sqlite') {
        warnings.push('Development using PostgreSQL schema with SQLite URL (might be intentional)');
      }
    }
  }

  return { issues, warnings };
};

// Generate recommendations
const generateRecommendations = (dbInfo, schemaInfo, environment, validation) => {
  const recommendations = [];

  if (validation.issues.length === 0) {
    return ['✅ Configuration is valid - no changes needed'];
  }

  if (!dbInfo.valid && !schemaInfo.valid) {
    recommendations.push('1. Run: npm run schema:select (to set up schema)');
    recommendations.push('2. Set DATABASE_URL environment variable');
  } else if (!schemaInfo.valid) {
    recommendations.push('1. Run: npm run schema:select (to fix schema)');
  } else if (!dbInfo.valid) {
    if (environment.type === 'production') {
      recommendations.push('1. Set DATABASE_URL to PostgreSQL connection string');
    } else {
      recommendations.push('1. Set DATABASE_URL=file:./dev.db for development');
    }
  } else if (dbInfo.type !== schemaInfo.provider) {
    if (environment.type === 'production') {
      recommendations.push('1. Run: npm run schema:postgresql');
      recommendations.push('2. Ensure DATABASE_URL points to PostgreSQL');
    } else {
      recommendations.push('1. Run: npm run schema:sqlite (for development)');
      recommendations.push('2. Set DATABASE_URL=file:./dev.db');
    }
  }

  return recommendations;
};

// Main validation logic
try {
  const environment = detectEnvironment();
  const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL);
  const schemaInfo = parseSchemaProvider();
  const validation = validateConsistency(dbInfo, schemaInfo, environment);
  const recommendations = generateRecommendations(dbInfo, schemaInfo, environment, validation);

  console.log('[DB VALIDATOR] 📊 Configuration Analysis:');
  console.log('');
  
  // Environment info
  console.log('🌍 Environment:');
  console.log(`  Type: ${environment.type.toUpperCase()}`);
  console.log(`  NODE_ENV: ${environment.indicators.nodeEnv || 'not-set'}`);
  console.log(`  CHOREO_DEPLOYMENT: ${environment.indicators.choreoDeployment || 'not-set'}`);
  console.log('');

  // Database URL info
  console.log('🔗 Database URL:');
  console.log(`  Status: ${dbInfo.valid ? '✅' : '❌'} ${dbInfo.message}`);
  if (dbInfo.valid && dbInfo.connection) {
    console.log(`  Connection: ${dbInfo.connection}`);
  }
  console.log('');

  // Schema info
  console.log('📋 Prisma Schema:');
  console.log(`  Status: ${schemaInfo.valid ? '✅' : '❌'} ${schemaInfo.message}`);
  console.log('');

  // Validation results
  if (validation.issues.length > 0) {
    console.log('❌ Issues Found:');
    validation.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log('');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    validation.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  // Recommendations
  console.log('💡 Recommendations:');
  recommendations.forEach((rec, index) => {
    console.log(`  ${rec}`);
  });
  console.log('');

  // Exit with appropriate code
  if (validation.issues.length > 0) {
    console.log('[DB VALIDATOR] ❌ Validation failed - please fix the issues above');
    process.exit(1);
  } else {
    console.log('[DB VALIDATOR] ✅ Configuration is valid');
    if (validation.warnings.length > 0) {
      console.log('[DB VALIDATOR] ⚠️ Note the warnings above for optimal setup');
    }
  }

} catch (error) {
  console.error('[DB VALIDATOR] ❌ Validation error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('[DB VALIDATOR] ✅ Validation completed'); 