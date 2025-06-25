#!/usr/bin/env node

/**
 * GitHub Actions Choreo Build Validator
 * Comprehensive testing script for Choreo deployment compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChoreoValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.results = {
      fileStructure: false,
      packageJson: false,
      dockerfile: false,
      choreoYaml: false,
      buildTest: false,
      standaloneTest: false,
      environmentTest: false
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    }
  }

  async validateFileStructure() {
    this.log('Validating file structure...', 'info');
    
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'Dockerfile',
      'choreo.yaml',
      'src/app/layout.tsx',
      'src/app/api/health/route.ts'
    ];

    const optionalFiles = [
      'start.sh',
      '.env.example',
      'README.md'
    ];

    let allRequired = true;

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.log(`Required file found: ${file}`, 'success');
      } else {
        this.log(`Required file missing: ${file}`, 'error');
        allRequired = false;
      }
    }

    for (const file of optionalFiles) {
      if (fs.existsSync(file)) {
        this.log(`Optional file found: ${file}`, 'success');
      } else {
        this.log(`Optional file missing: ${file}`, 'warning');
      }
    }

    // Check for merge conflict markers
    try {
      const result = execSync('grep -r "<<<<<<< HEAD\\|=======" . --exclude-dir=node_modules --exclude-dir=.git', { encoding: 'utf8' });
      if (result.trim()) {
        this.log('Merge conflict markers found in files', 'error');
        allRequired = false;
      }
    } catch (error) {
      // No merge conflicts found (grep returns non-zero when no matches)
      this.log('No merge conflicts detected', 'success');
    }

    this.results.fileStructure = allRequired;
    return allRequired;
  }

  async validatePackageJson() {
    this.log('Validating package.json...', 'info');
    
    try {
      const packageContent = fs.readFileSync('package.json', 'utf8');
      const pkg = JSON.parse(packageContent);

      // Check required scripts
      const requiredScripts = ['build', 'start', 'dev'];
      let allScripts = true;

      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          this.log(`Script found: ${script}`, 'success');
        } else {
          this.log(`Required script missing: ${script}`, 'error');
          allScripts = false;
        }
      }

      // Check Next.js version
      if (pkg.dependencies && pkg.dependencies.next) {
        const nextVersion = pkg.dependencies.next;
        this.log(`Next.js version: ${nextVersion}`, 'info');
        
        if (nextVersion.includes('15.')) {
          this.log('Next.js 15.x detected - good for Choreo', 'success');
        } else {
          this.log('Consider upgrading to Next.js 15.x for better Choreo compatibility', 'warning');
        }
      }

      // Check for Supabase dependencies
      const supabaseDeps = ['@supabase/supabase-js'];
      for (const dep of supabaseDeps) {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          this.log(`Supabase dependency found: ${dep}`, 'success');
        }
      }

      // Check for Choreo-specific scripts
      const choreoScripts = ['choreo:build', 'choreo:start', 'choreo:test'];
      for (const script of choreoScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          this.log(`Choreo script found: ${script}`, 'success');
        }
      }

      this.results.packageJson = allScripts;
      return allScripts;

    } catch (error) {
      this.log(`package.json validation failed: ${error.message}`, 'error');
      this.results.packageJson = false;
      return false;
    }
  }

  async validateDockerfile() {
    this.log('Validating Dockerfile...', 'info');
    
    try {
      const dockerContent = fs.readFileSync('Dockerfile', 'utf8');
      let isValid = true;

      // Check for Node.js base image
      if (dockerContent.includes('FROM node:')) {
        this.log('Node.js base image found', 'success');
      } else {
        this.log('Node.js base image not found', 'error');
        isValid = false;
      }

      // Check for /workspace working directory
      if (dockerContent.includes('WORKDIR /workspace')) {
        this.log('/workspace working directory found', 'success');
      } else {
        this.log('/workspace working directory missing - required for Choreo', 'error');
        isValid = false;
      }

      // Check for multi-stage build
      if (dockerContent.includes('FROM node:') && dockerContent.split('FROM').length > 2) {
        this.log('Multi-stage build detected', 'success');
      } else {
        this.log('Consider using multi-stage build for optimization', 'warning');
      }

      // Check for standalone output
      if (dockerContent.includes('standalone')) {
        this.log('Standalone build configuration found', 'success');
      } else {
        this.log('Standalone build configuration missing', 'warning');
      }

      // Check for environment variables
      const envVars = ['NODE_ENV', 'NEXT_PUBLIC_SUPABASE_URL', 'DATABASE_URL'];
      for (const envVar of envVars) {
        if (dockerContent.includes(envVar)) {
          this.log(`Environment variable handling found: ${envVar}`, 'success');
        }
      }

      this.results.dockerfile = isValid;
      return isValid;

    } catch (error) {
      this.log(`Dockerfile validation failed: ${error.message}`, 'error');
      this.results.dockerfile = false;
      return false;
    }
  }

  async validateChoreoYaml() {
    this.log('Validating choreo.yaml...', 'info');
    
    try {
      const choreoContent = fs.readFileSync('choreo.yaml', 'utf8');
      let isValid = true;

      // Check for required sections
      const requiredSections = ['apiVersion', 'kind', 'metadata', 'spec'];
      for (const section of requiredSections) {
        if (choreoContent.includes(section)) {
          this.log(`Required section found: ${section}`, 'success');
        } else {
          this.log(`Required section missing: ${section}`, 'error');
          isValid = false;
        }
      }

      // Check for Docker runtime
      if (choreoContent.includes('runtime: docker')) {
        this.log('Docker runtime specified', 'success');
      } else {
        this.log('Docker runtime not specified', 'warning');
      }

      // Check for health checks
      if (choreoContent.includes('healthCheck')) {
        this.log('Health check configuration found', 'success');
      } else {
        this.log('Health check configuration missing', 'warning');
      }

      // Check for resource limits
      if (choreoContent.includes('resources:')) {
        this.log('Resource limits specified', 'success');
      } else {
        this.log('Resource limits not specified', 'warning');
      }

      this.results.choreoYaml = isValid;
      return isValid;

    } catch (error) {
      this.log(`choreo.yaml validation failed: ${error.message}`, 'error');
      this.results.choreoYaml = false;
      return false;
    }
  }

  async validateEnvironment() {
    this.log('Validating environment configuration...', 'info');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    let envValid = true;

    // Check if environment variables are referenced in the code
    try {
      const appFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | head -20', { encoding: 'utf8' }).trim().split('\n');
      
      for (const envVar of requiredEnvVars) {
        let found = false;
        
        for (const file of appFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(envVar)) {
              found = true;
              break;
            }
          }
        }
        
        if (found) {
          this.log(`Environment variable referenced: ${envVar}`, 'success');
        } else {
          this.log(`Environment variable not found in code: ${envVar}`, 'warning');
        }
      }

      // Check for .env.example
      if (fs.existsSync('.env.example')) {
        const envExample = fs.readFileSync('.env.example', 'utf8');
        for (const envVar of requiredEnvVars) {
          if (envExample.includes(envVar)) {
            this.log(`Environment variable documented: ${envVar}`, 'success');
          }
        }
      }

    } catch (error) {
      this.log(`Environment validation failed: ${error.message}`, 'warning');
    }

    this.results.environmentTest = envValid;
    return envValid;
  }

  async runBuildTest() {
    this.log('Running build test...', 'info');
    
    try {
      // Set test environment variables
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';

      // Install dependencies
      this.log('Installing dependencies...', 'info');
      execSync('npm ci --legacy-peer-deps', { stdio: 'inherit' });

      // Run build
      this.log('Running Next.js build...', 'info');
      execSync('npm run build', { stdio: 'inherit' });

      // Check build outputs
      const buildChecks = [
        { file: '.next/standalone/server.js', name: 'Standalone server' },
        { file: '.next/BUILD_ID', name: 'BUILD_ID' },
        { file: '.next/static', name: 'Static assets' }
      ];

      let buildValid = true;
      for (const check of buildChecks) {
        if (fs.existsSync(check.file)) {
          this.log(`${check.name} created successfully`, 'success');
        } else {
          this.log(`${check.name} missing after build`, 'error');
          buildValid = false;
        }
      }

      this.results.buildTest = buildValid;
      return buildValid;

    } catch (error) {
      this.log(`Build test failed: ${error.message}`, 'error');
      this.results.buildTest = false;
      return false;
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    const report = `
# Choreo Build Validation Report

**Generated:** ${timestamp}
**Success Rate:** ${successRate}% (${passedTests}/${totalTests} tests passed)

## Test Results

${Object.entries(this.results).map(([test, passed]) => 
  `- ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
).join('\n')}

## Summary

${this.errors.length === 0 ? 
  '🎉 **All critical tests passed!** Your build should work in Choreo.' : 
  `❌ **${this.errors.length} error(s) found** - these must be fixed before Choreo deployment.`
}

${this.warnings.length > 0 ? 
  `⚠️ **${this.warnings.length} warning(s)** - consider addressing these for optimal performance.` : 
  ''
}

## Errors
${this.errors.map(error => `- ❌ ${error}`).join('\n')}

## Warnings  
${this.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}

## Next Steps

${successRate >= 90 ? 
  `✅ **HIGH CONFIDENCE** - Your build is ready for Choreo deployment!

1. Commit and push your changes
2. Deploy to Choreo with confidence
3. Monitor the deployment logs for any runtime issues` :
  `⚠️ **NEEDS ATTENTION** - Fix the errors above before deploying to Choreo.

1. Address all error conditions
2. Re-run this validation
3. Only deploy when success rate is 90%+`
}

## Deployment Confidence: ${successRate >= 90 ? 'HIGH ✅' : successRate >= 70 ? 'MEDIUM ⚠️' : 'LOW ❌'}
`;

    fs.writeFileSync('choreo-validation-report.md', report);
    this.log('Validation report generated: choreo-validation-report.md', 'success');
    
    return {
      successRate,
      errors: this.errors.length,
      warnings: this.warnings.length,
      confidence: successRate >= 90 ? 'HIGH' : successRate >= 70 ? 'MEDIUM' : 'LOW'
    };
  }

  async run() {
    this.log('Starting Choreo build validation...', 'info');
    
    await this.validateFileStructure();
    await this.validatePackageJson();
    await this.validateDockerfile();
    await this.validateChoreoYaml();
    await this.validateEnvironment();
    await this.runBuildTest();
    
    const summary = await this.generateReport();
    
    this.log(`Validation completed with ${summary.confidence} confidence`, 
      summary.confidence === 'HIGH' ? 'success' : 'warning');
    
    // Exit with appropriate code
    process.exit(summary.errors > 0 ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new ChoreoValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = ChoreoValidator; 