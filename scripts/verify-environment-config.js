#!/usr/bin/env node

/**
 * Environment-Specific Configuration Validator
 * 
 * This script validates that all required environment variables are present
 * and correctly configured for the current environment (dev, prod, choreo).
 * 
 * It checks:
 * 1. Required environment variables per environment
 * 2. Format validation for critical variables
 * 3. Compatibility between related variables
 * 4. Environment-specific configuration requirements
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Start validation
console.log('🔍 Starting environment configuration validation...');

// Determine current environment
function detectEnvironment() {
  // Determine environment from multiple indicators
  const nodeEnv = process.env.NODE_ENV || 'development';
  const deployEnv = process.env.DEPLOY_ENV || '';
  const choreoDeployment = process.env.CHOREO_DEPLOYMENT === 'true';
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Production indicators
  const isProduction = 
    nodeEnv === 'production' ||
    deployEnv === 'production' ||
    choreoDeployment ||
    /postgres(ql)?:\/\//.test(dbUrl);
    
  // Choreo specific detection
  const isChoreo = 
    choreoDeployment ||
    deployEnv === 'choreo' ||
    process.env.NEXT_PUBLIC_DEPLOY_ENV === 'choreo';
    
  // Development environment
  const isDevelopment = !isProduction;
  
  const environment = {
    name: isChoreo ? 'choreo' : (isProduction ? 'production' : 'development'),
    isProduction,
    isDevelopment,
    isChoreo,
    nodeEnv,
    deployEnv,
  };
  
  console.log(`🌍 Detected environment: ${environment.name.toUpperCase()}`);
  console.log(`  - NODE_ENV: ${environment.nodeEnv}`);
  console.log(`  - DEPLOY_ENV: ${environment.deployEnv || '(not set)'}`);
  console.log(`  - Production mode: ${environment.isProduction ? 'Yes' : 'No'}`);
  console.log(`  - Choreo mode: ${environment.isChoreo ? 'Yes' : 'No'}`);
  
  return environment;
}

// Define required variables per environment
function getRequiredVariables(environment) {
  // Common required variables for all environments
  const common = [
    'NODE_ENV',
    'DATABASE_URL',
  ];
  
  // Production/Choreo specific requirements
  const production = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'APP_URL',
  ];
  
  // Choreo specific requirements
  const choreo = [
    'CLERK_JWT_VERIFICATION_KEY',
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
  ];
  
  // Development specific
  const development = [];
  
  // Combine required variables based on environment
  let required = [...common];
  
  if (environment.isProduction) {
    required = [...required, ...production];
  }
  
  if (environment.isChoreo) {
    required = [...required, ...choreo];
  }
  
  if (environment.isDevelopment) {
    required = [...required, ...development];
  }
  
  return required;
}

// Validate individual environment variable
function validateVariable(name, value, environment) {
  // Skip if value is undefined (will be caught by missing check)
  if (value === undefined) {
    return {
      valid: false,
      message: 'Variable is not defined'
    };
  }
  
  // Format validation functions for specific variables
  const validators = {
    DATABASE_URL: (val) => {
      if (val.startsWith('file:')) {
        // SQLite format check
        return {
          valid: true,
          message: 'SQLite connection string',
          type: 'sqlite',
          compatible: environment.isDevelopment // SQLite only valid in dev
        };
      } else if (/postgres(ql)?:\/\//.test(val)) {
        try {
          // Try parsing as URL to validate format
          new URL(val);
          return {
            valid: true, 
            message: 'PostgreSQL connection string',
            type: 'postgresql',
            compatible: true // PostgreSQL valid in all environments
          };
        } catch (e) {
          return {
            valid: false,
            message: 'Invalid PostgreSQL connection string format',
            error: e.message
          };
        }
      } else {
        return {
          valid: false,
          message: 'Unrecognized database connection format'
        };
      }
    },
    
    NEXTAUTH_URL: (val) => {
      try {
        const url = new URL(val);
        const isSecure = url.protocol === 'https:';
        
        return {
          valid: true,
          message: `Valid URL (${url.protocol}//${url.host})`,
          secure: isSecure,
          compatible: !environment.isProduction || isSecure // Must be HTTPS in prod
        };
      } catch (e) {
        return {
          valid: false,
          message: 'Invalid URL format',
          error: e.message
        };
      }
    },
    
    APP_URL: (val) => {
      try {
        const url = new URL(val);
        const isSecure = url.protocol === 'https:';
        
        return {
          valid: true,
          message: `Valid URL (${url.protocol}//${url.host})`,
          secure: isSecure,
          compatible: !environment.isProduction || isSecure // Must be HTTPS in prod
        };
      } catch (e) {
        return {
          valid: false,
          message: 'Invalid URL format',
          error: e.message
        };
      }
    },
    
    JWT_SECRET: (val) => {
      const isStrong = val.length >= 32;
      return {
        valid: true,
        message: isStrong ? 'Valid' : 'Valid but weak (should be at least 32 chars)',
        secure: isStrong,
        compatible: true
      };
    },
    
    NEXTAUTH_SECRET: (val) => {
      const isStrong = val.length >= 32;
      return {
        valid: true,
        message: isStrong ? 'Valid' : 'Valid but weak (should be at least 32 chars)',
        secure: isStrong,
        compatible: true
      };
    },
    
    // Add validators for other variables as needed
  };
  
  // Use specific validator if available, otherwise just check not empty
  if (validators[name]) {
    return validators[name](value);
  }
  
  // Default validator just ensures value is not empty
  return {
    valid: value.trim() !== '',
    message: value.trim() !== '' ? 'Valid' : 'Empty value',
    compatible: true
  };
}

// Main validation function
function validateEnvironmentVariables(environment) {
  const required = getRequiredVariables(environment);
  const results = {
    missing: [],
    invalid: [],
    insecure: [],
    incompatible: [],
    valid: [],
    optional: []
  };
  
  // Define optional variables (useful but not required)
  const optionalVars = [
    'NEXT_PUBLIC_APP_VERSION',
    'PORT'
  ];
  
  // Validate each required variable
  required.forEach(varName => {
    const value = process.env[varName];
    
    // Check if variable exists
    if (value === undefined) {
      results.missing.push(varName);
      return;
    }
    
    // Validate variable format
    const validation = validateVariable(varName, value, environment);
    
    if (!validation.valid) {
      results.invalid.push({
        name: varName,
        reason: validation.message,
        error: validation.error
      });
    } else if (validation.valid && validation.secure === false) {
      results.insecure.push({
        name: varName,
        reason: validation.message
      });
      results.valid.push(varName);
    } else if (validation.valid && validation.compatible === false) {
      results.incompatible.push({
        name: varName,
        reason: validation.message,
        environment: environment.name
      });
      results.valid.push(varName);
    } else {
      results.valid.push(varName);
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value !== undefined) {
      // Validate if present
      const validation = validateVariable(varName, value, environment);
      if (validation.valid) {
        results.optional.push({
          name: varName,
          status: 'provided'
        });
      } else {
        results.optional.push({
          name: varName,
          status: 'invalid',
          reason: validation.message
        });
      }
    } else {
      results.optional.push({
        name: varName,
        status: 'missing'
      });
    }
  });
  
  return results;
}

// Custom environment-specific checks
function performEnvironmentSpecificChecks(environment) {
  const issues = [];
  
  // Production specific validations
  if (environment.isProduction) {
    // Check database type (must be PostgreSQL in production)
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres')) {
      issues.push({
        severity: 'critical',
        message: 'Production requires PostgreSQL database',
        context: {
          current: 'SQLite',
          required: 'PostgreSQL'
        }
      });
    }
    
    // Check URL security
    const urlVars = ['NEXTAUTH_URL', 'APP_URL'];
    urlVars.forEach(varName => {
      const url = process.env[varName];
      if (url && !url.startsWith('https://')) {
        issues.push({
          severity: 'warning',
          message: `${varName} should use HTTPS in production`,
          context: {
            current: url.split('://')[0],
            required: 'https'
          }
        });
      }
    });
  }
  
  // Choreo specific validations
  if (environment.isChoreo) {
    // Check ports
    if (process.env.PORT && process.env.PORT !== '8080') {
      issues.push({
        severity: 'warning',
        message: 'Choreo typically uses port 8080',
        context: {
          current: process.env.PORT,
          recommended: '8080'
        }
      });
    }
    
    // Check for Clerk keys if in Choreo auth mode
    const clerkMode = process.env.AUTH_PROVIDER === 'clerk' || process.env.NEXT_AUTH_PROVIDER === 'clerk';
    if (clerkMode) {
      const clerkVars = ['CLERK_JWT_VERIFICATION_KEY', 'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY'];
      const missingClerkVars = clerkVars.filter(v => !process.env[v]);
      
      if (missingClerkVars.length > 0) {
        issues.push({
          severity: 'critical',
          message: 'Missing Clerk authentication variables in Clerk mode',
          context: {
            missing: missingClerkVars.join(', ')
          }
        });
      }
    }
  }
  
  return issues;
}

// Generate recommendations for fixing issues
function generateRecommendations(environment, validationResults, specificIssues) {
  const recommendations = [];
  
  // Handle missing variables
  if (validationResults.missing.length > 0) {
    recommendations.push({
      action: 'Set missing environment variables',
      variables: validationResults.missing,
      importance: 'critical'
    });
  }
  
  // Handle invalid variables
  if (validationResults.invalid.length > 0) {
    validationResults.invalid.forEach(item => {
      recommendations.push({
        action: `Fix invalid format for ${item.name}`,
        details: item.reason,
        importance: 'critical'
      });
    });
  }
  
  // Handle insecure variables
  if (validationResults.insecure.length > 0) {
    validationResults.insecure.forEach(item => {
      recommendations.push({
        action: `Improve security for ${item.name}`,
        details: item.reason,
        importance: 'medium'
      });
    });
  }
  
  // Handle environment-specific issues
  if (specificIssues.length > 0) {
    specificIssues.forEach(issue => {
      if (issue.severity === 'critical') {
        recommendations.push({
          action: issue.message,
          details: JSON.stringify(issue.context),
          importance: 'critical'
        });
      } else {
        recommendations.push({
          action: issue.message,
          details: JSON.stringify(issue.context),
          importance: 'medium'
        });
      }
    });
  }
  
  return recommendations;
}

// Determine if validation should halt the application
function shouldHaltApplication(environment, validationResults, specificIssues) {
  // Always halt if critical variables are missing in any environment
  if (validationResults.missing.length > 0) {
    return true;
  }
  
  // Always halt if variables have invalid formats
  if (validationResults.invalid.length > 0) {
    return true;
  }
  
  // Check for critical environment-specific issues
  const hasCriticalIssues = specificIssues.some(issue => issue.severity === 'critical');
  
  // In production, be more lenient to prevent deployment failures
  if (environment.isProduction) {
    // Only halt for the most critical issues in production
    return hasCriticalIssues;
  }
  
  // In development, be more strict
  return hasCriticalIssues || validationResults.incompatible.length > 0;
}

// Main function
function main() {
  try {
    // Detect environment
    const environment = detectEnvironment();
    
    // Validate environment variables
    const validationResults = validateEnvironmentVariables(environment);
    
    // Perform environment-specific checks
    const specificIssues = performEnvironmentSpecificChecks(environment);
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      environment, 
      validationResults, 
      specificIssues
    );
    
    // Print validation results
    console.log('\n📊 Environment Validation Results:');
    
    // Valid variables
    console.log(`\n✅ Valid Variables (${validationResults.valid.length}):`);
    if (validationResults.valid.length > 0) {
      validationResults.valid.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('  (None)');
    }
    
    // Missing variables
    console.log(`\n❌ Missing Required Variables (${validationResults.missing.length}):`);
    if (validationResults.missing.length > 0) {
      validationResults.missing.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('  (None)');
    }
    
    // Invalid variables
    console.log(`\n⚠️ Invalid Variables (${validationResults.invalid.length}):`);
    if (validationResults.invalid.length > 0) {
      validationResults.invalid.forEach(item => 
        console.log(`  - ${item.name}: ${item.reason}`)
      );
    } else {
      console.log('  (None)');
    }
    
    // Incompatible with environment
    console.log(`\n🚫 Environment Incompatibilities (${validationResults.incompatible.length}):`);
    if (validationResults.incompatible.length > 0) {
      validationResults.incompatible.forEach(item => 
        console.log(`  - ${item.name}: ${item.reason} [${item.environment}]`)
      );
    } else {
      console.log('  (None)');
    }
    
    // Security warnings
    console.log(`\n🔒 Security Concerns (${validationResults.insecure.length}):`);
    if (validationResults.insecure.length > 0) {
      validationResults.insecure.forEach(item => 
        console.log(`  - ${item.name}: ${item.reason}`)
      );
    } else {
      console.log('  (None)');
    }
    
    // Environment-specific issues
    console.log(`\n🌍 Environment-Specific Issues (${specificIssues.length}):`);
    if (specificIssues.length > 0) {
      specificIssues.forEach(issue => 
        console.log(`  - [${issue.severity.toUpperCase()}] ${issue.message}`)
      );
    } else {
      console.log('  (None)');
    }
    
    // Optional variables
    console.log('\n📝 Optional Variables:');
    validationResults.optional.forEach(item => {
      if (item.status === 'provided') {
        console.log(`  - ${item.name}: ✅ Provided`);
      } else if (item.status === 'invalid') {
        console.log(`  - ${item.name}: ⚠️ Invalid (${item.reason})`);
      } else {
        console.log(`  - ${item.name}: ℹ️ Not provided (optional)`);
      }
    });
    
    // Recommendations
    console.log('\n🛠️ Recommendations:');
    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        const importanceEmoji = 
          rec.importance === 'critical' ? '🔴' :
          rec.importance === 'high' ? '🟠' : 
          rec.importance === 'medium' ? '🟡' : '🔵';
          
        console.log(`  ${index + 1}. ${importanceEmoji} ${rec.action}`);
        if (rec.details) {
          console.log(`     ${rec.details}`);
        }
      });
    } else {
      console.log('  ✅ No recommendations - configuration looks good!');
    }
    
    // Final result
    const shouldHalt = shouldHaltApplication(environment, validationResults, specificIssues);
    
    console.log('\n🏁 Final Result:');
    if (shouldHalt) {
      console.log('❌ FAILED: Critical configuration issues detected');
      process.exit(1);
    } else {
      console.log('✅ PASSED: Configuration is valid for this environment');
      if (recommendations.length > 0) {
        console.log('   (With non-critical recommendations)');
      }
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error during environment validation:', error);
    process.exit(1);
  }
}

// Run the validation
main();
