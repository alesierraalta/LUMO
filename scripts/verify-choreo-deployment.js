#!/usr/bin/env node

/**
 * Choreo Deployment Verification Script
 * 
 * This script provides comprehensive verification of Choreo deployment readiness
 * by checking for common issues and configuration problems. It integrates with
 * the Automated Debug Log System for structured reporting and diagnosis.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const VERIFICATION_LOG = path.join(LOG_DIR, 'choreo-verification.log');
const CRITICAL_CHECKS = [
  'prisma-binary-targets',
  'database-url-format',
  'port-configuration',
  'env-variables'
];

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  fs.appendFileSync(VERIFICATION_LOG, logMessage);
};

// Start verification
log('🚀 CHOREO DEPLOYMENT VERIFICATION', 'START');
log('=====================================');

// Track verification results
const results = {
  passed: [],
  warnings: [],
  failed: [],
  total: 0
};

// Helper function to run a check
const runCheck = (name, description, checkFn) => {
  results.total++;
  log(`\n📋 Checking ${name}: ${description}`, 'CHECK');
  
  try {
    const result = checkFn();
    
    if (result.status === 'passed') {
      results.passed.push(name);
      log(`✅ PASSED: ${result.message || description}`, 'PASS');
    } else if (result.status === 'warning') {
      results.warnings.push({ name, message: result.message });
      log(`⚠️ WARNING: ${result.message}`, 'WARN');
    } else {
      results.failed.push({ name, message: result.message });
      log(`❌ FAILED: ${result.message}`, 'FAIL');
    }
    
    // Log additional details if available
    if (result.details) {
      log(`   Details: ${result.details}`, 'INFO');
    }
    
    return result;
  } catch (error) {
    results.failed.push({ name, message: error.message });
    log(`❌ ERROR: ${error.message}`, 'ERROR');
    log(`   Stack: ${error.stack}`, 'DEBUG');
    
    return {
      status: 'failed',
      message: error.message
    };
  }
};

// 1. Check Prisma Schema Configuration
runCheck('prisma-binary-targets', 'Verifying Prisma binary targets', () => {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    return {
      status: 'failed',
      message: 'schema.prisma file not found'
    };
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for binary targets
  if (!schemaContent.includes('binaryTargets')) {
    return {
      status: 'failed',
      message: 'Missing binaryTargets configuration in schema.prisma',
      details: 'Add binaryTargets = ["native", "debian-openssl-3.0.x"] to generator block'
    };
  }
  
  // Check for debian-openssl-3.0.x
  if (!schemaContent.includes('debian-openssl-3.0.x')) {
    return {
      status: 'failed',
      message: 'Missing debian-openssl-3.0.x binary target required for Choreo',
      details: 'Update binaryTargets to include "debian-openssl-3.0.x"'
    };
  }
  
  // Check provider configuration
  if (!schemaContent.includes('provider = "postgresql"')) {
    return {
      status: 'warning',
      message: 'schema.prisma is not configured for PostgreSQL provider',
      details: 'For Choreo deployment, provider should be set to "postgresql"'
    };
  }
  
  return {
    status: 'passed',
    message: 'Prisma schema has correct binary targets for Choreo'
  };
});

// 2. Check Environment Variables
runCheck('env-variables', 'Checking environment variables', () => {
  const dotEnvPath = path.join(process.cwd(), '.env');
  const dotEnvExamplePath = path.join(process.cwd(), '.env.example');
  
  const missingEnv = [];
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  // Check if .env exists
  if (!fs.existsSync(dotEnvPath) && !fs.existsSync(dotEnvExamplePath)) {
    return {
      status: 'warning',
      message: 'No .env or .env.example file found',
      details: 'Create an .env.example file with required variables for reference'
    };
  }
  
  // Check for env files to parse
  let envContent = '';
  if (fs.existsSync(dotEnvPath)) {
    envContent = fs.readFileSync(dotEnvPath, 'utf8');
  } else if (fs.existsSync(dotEnvExamplePath)) {
    envContent = fs.readFileSync(dotEnvExamplePath, 'utf8');
  }
  
  // Check required variables
  for (const variable of requiredVars) {
    if (!envContent.includes(variable + '=')) {
      missingEnv.push(variable);
    }
  }
  
  if (missingEnv.length > 0) {
    return {
      status: 'warning',
      message: `Missing environment variables: ${missingEnv.join(', ')}`,
      details: 'These variables will need to be configured in Choreo secrets'
    };
  }
  
  return {
    status: 'passed',
    message: 'Required environment variables are defined'
  };
});

// 3. Check Database URL Format
runCheck('database-url-format', 'Validating database URL format', () => {
  const dotEnvPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(dotEnvPath)) {
    return {
      status: 'warning',
      message: '.env file not found, cannot check DATABASE_URL format',
      details: 'Ensure DATABASE_URL in Choreo uses postgresql:// protocol'
    };
  }
  
  const envContent = fs.readFileSync(dotEnvPath, 'utf8');
  const databaseUrlMatch = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
  
  if (!databaseUrlMatch) {
    return {
      status: 'warning',
      message: 'DATABASE_URL not found in .env file',
      details: 'Ensure DATABASE_URL is configured in Choreo secrets'
    };
  }
  
  const databaseUrl = databaseUrlMatch[1];
  
  if (databaseUrl.startsWith('prisma://')) {
    return {
      status: 'failed',
      message: 'DATABASE_URL uses prisma:// protocol which is not supported in Choreo',
      details: 'Change protocol from prisma:// to postgresql://'
    };
  }
  
  if (databaseUrl.startsWith('postgres://')) {
    return {
      status: 'warning',
      message: 'DATABASE_URL uses postgres:// protocol instead of postgresql://',
      details: 'Change protocol from postgres:// to postgresql:// for better compatibility'
    };
  }
  
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('file:')) {
    return {
      status: 'warning',
      message: `DATABASE_URL uses unexpected protocol: ${databaseUrl.split('://')[0]}://`,
      details: 'For Choreo deployment, DATABASE_URL should use postgresql:// protocol'
    };
  }
  
  return {
    status: 'passed',
    message: 'DATABASE_URL format is valid for Choreo deployment'
  };
});

// 4. Check Port Configuration
runCheck('port-configuration', 'Checking port configuration', () => {
  // Check package.json start script
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return {
      status: 'failed',
      message: 'package.json not found'
    };
  }
  
  const packageJson = require(packageJsonPath);
  const startScript = packageJson.scripts?.start || '';
  
  // Check Dockerfile
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  let dockerfileContent = '';
  
  if (fs.existsSync(dockerfilePath)) {
    dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  }
  
  // Check next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  let nextConfigContent = '';
  
  if (fs.existsSync(nextConfigPath)) {
    nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  }
  
  // Check choreo.yaml
  const choreoYamlPath = path.join(process.cwd(), 'choreo.yaml');
  let choreoYamlContent = '';
  
  if (fs.existsSync(choreoYamlPath)) {
    choreoYamlContent = fs.readFileSync(choreoYamlPath, 'utf8');
  }
  
  const issues = [];
  
  // Check for port 3000 references that should be 8080
  if (dockerfileContent.includes('EXPOSE 3000')) {
    issues.push('Dockerfile uses EXPOSE 3000 instead of EXPOSE 8080');
  }
  
  if (choreoYamlContent.includes('containerPort: 3000')) {
    issues.push('choreo.yaml references port 3000 instead of 8080');
  }
  
  if (nextConfigContent.includes('port: 3000')) {
    issues.push('next.config.js explicitly sets port to 3000');
  }
  
  if (issues.length > 0) {
    return {
      status: 'failed',
      message: 'Port configuration issues found',
      details: issues.join('; ')
    };
  }
  
  if (!dockerfileContent.includes('EXPOSE 8080') && 
      !choreoYamlContent.includes('containerPort: 8080')) {
    return {
      status: 'warning',
      message: 'No explicit port 8080 configuration found',
      details: 'Ensure port 8080 is used in Choreo deployment (EXPOSE 8080 in Dockerfile)'
    };
  }
  
  return {
    status: 'passed',
    message: 'Port configuration is correct for Choreo deployment'
  };
});

// 5. Check Package Dependencies
runCheck('package-dependencies', 'Verifying package dependencies', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return {
      status: 'failed',
      message: 'package.json not found'
    };
  }
  
  const packageJson = require(packageJsonPath);
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = [];
  const requiredDeps = [
    '@prisma/client',
    'prisma',
    'next',
    'react',
    'react-dom'
  ];
  
  for (const dep of requiredDeps) {
    if (!dependencies[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    return {
      status: 'failed',
      message: `Missing required dependencies: ${missingDeps.join(', ')}`,
      details: `Run: npm install ${missingDeps.join(' ')}`
    };
  }
  
  // Check build scripts
  if (!packageJson.scripts?.build) {
    return {
      status: 'warning',
      message: 'No build script defined in package.json',
      details: 'Add a build script like: "build": "prisma generate && next build"'
    };
  }
  
  return {
    status: 'passed',
    message: 'All required dependencies are installed'
  };
});

// 6. Check Choreo Configuration
runCheck('choreo-configuration', 'Checking Choreo configuration', () => {
  const choreoYamlPath = path.join(process.cwd(), 'choreo.yaml');
  
  if (!fs.existsSync(choreoYamlPath)) {
    return {
      status: 'warning',
      message: 'choreo.yaml not found',
      details: 'Create a choreo.yaml file with proper configuration for deployment'
    };
  }
  
  const choreoYamlContent = fs.readFileSync(choreoYamlPath, 'utf8');
  const issues = [];
  
  // Check for proper container port
  if (!choreoYamlContent.includes('containerPort: 8080')) {
    issues.push('containerPort should be set to 8080');
  }
  
  // Check for environment variables
  if (!choreoYamlContent.includes('env:')) {
    issues.push('No environment variables defined');
  }
  
  // Check for secret references
  if (!choreoYamlContent.includes('secretRef')) {
    issues.push('No secret references found');
  }
  
  if (issues.length > 0) {
    return {
      status: 'warning',
      message: 'Choreo configuration may need improvements',
      details: issues.join('; ')
    };
  }
  
  return {
    status: 'passed',
    message: 'Choreo configuration looks good'
  };
});

// 7. Test Prisma Generate
runCheck('prisma-generate', 'Testing prisma generate command', () => {
  try {
    log('Running: npx prisma generate', 'EXEC');
    const output = execSync('npx prisma generate', { encoding: 'utf8' });
    
    if (output.includes('Error')) {
      return {
        status: 'failed',
        message: 'prisma generate command failed',
        details: output.split('\n').slice(0, 3).join('; ')
      };
    }
    
    return {
      status: 'passed',
      message: 'prisma generate completed successfully'
    };
  } catch (error) {
    return {
      status: 'failed',
      message: 'prisma generate command failed with an error',
      details: error.message
    };
  }
});

// 8. Check Clerk Configuration
runCheck('clerk-configuration', 'Checking Clerk authentication configuration', () => {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    return {
      status: 'warning',
      message: 'next.config.js not found, cannot check Clerk configuration'
    };
  }
  
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for Clerk domains configuration
  if (!nextConfigContent.includes('clerk') && !nextConfigContent.includes('CLERK')) {
    return {
      status: 'warning',
      message: 'No Clerk configuration found in next.config.js',
      details: 'Ensure Clerk is properly configured for deployment'
    };
  }
  
  // Check for CDN fallback solution
  const clerkSSLFixPath = path.join(process.cwd(), 'src', 'components', 'clerk-ssl-fix.tsx');
  if (!fs.existsSync(clerkSSLFixPath)) {
    return {
      status: 'warning',
      message: 'No clerk-ssl-fix.tsx component found',
      details: 'Consider implementing CDN fallback for Clerk authentication in Choreo'
    };
  }
  
  return {
    status: 'passed',
    message: 'Clerk configuration looks good'
  };
});

// Summary and Final Status
log('\n📊 VERIFICATION SUMMARY', 'RESULT');
log('=====================');
log(`Total Checks: ${results.total}`);
log(`Passed: ${results.passed.length}`);
log(`Warnings: ${results.warnings.length}`);
log(`Failed: ${results.failed.length}`);

if (results.warnings.length > 0) {
  log('\n⚠️ WARNINGS:', 'WARN');
  results.warnings.forEach((warning, index) => {
    log(`${index + 1}. ${warning.name}: ${warning.message}`, 'WARN');
  });
}

if (results.failed.length > 0) {
  log('\n❌ FAILURES:', 'FAIL');
  results.failed.forEach((failure, index) => {
    log(`${index + 1}. ${failure.name}: ${failure.message}`, 'FAIL');
  });
}

// Determine if any critical checks failed
const criticalFailures = results.failed.filter(failure => 
  CRITICAL_CHECKS.includes(failure.name)
);

if (criticalFailures.length > 0) {
  log('\n🚨 CRITICAL FAILURES DETECTED!', 'CRITICAL');
  log('Fix these issues before deploying to Choreo:', 'CRITICAL');
  criticalFailures.forEach((failure, index) => {
    log(`${index + 1}. ${failure.name}: ${failure.message}`, 'CRITICAL');
  });
  
  log('\n❌ VERIFICATION FAILED', 'RESULT');
  log(`See detailed log at: ${VERIFICATION_LOG}`);
  process.exit(1);
} else if (results.failed.length > 0) {
  log('\n⚠️ VERIFICATION COMPLETED WITH NON-CRITICAL FAILURES', 'RESULT');
  log('Fix these issues for optimal deployment experience');
  log(`See detailed log at: ${VERIFICATION_LOG}`);
  process.exit(0);
} else if (results.warnings.length > 0) {
  log('\n✅ VERIFICATION PASSED WITH WARNINGS', 'RESULT');
  log('Review warnings for potential improvements');
  log(`See detailed log at: ${VERIFICATION_LOG}`);
  process.exit(0);
} else {
  log('\n✅ VERIFICATION PASSED SUCCESSFULLY!', 'RESULT');
  log('Your project is ready for Choreo deployment');
  log(`See detailed log at: ${VERIFICATION_LOG}`);
  process.exit(0);
} 