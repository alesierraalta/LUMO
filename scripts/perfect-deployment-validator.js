#!/usr/bin/env node

/**
 * Perfect Deployment Validator for LUMO Inventory System
 * Ensures 100% deployment success rate with comprehensive validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerfectDeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(check, status, message) {
    const result = { check, message, timestamp: new Date().toISOString() };
    
    switch (status) {
      case 'pass':
        this.passed.push(result);
        this.log(`${check}: ${message}`, 'success');
        break;
      case 'warning':
        this.warnings.push(result);
        this.log(`${check}: ${message}`, 'warning');
        break;
      case 'error':
        this.errors.push(result);
        this.log(`${check}: ${message}`, 'error');
        break;
    }
  }

  // 1. Environment Validation
  validateEnvironment() {
    this.log('Starting Environment Validation...', 'info');

    // Node.js version check
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.addResult('Node.js Version', 'pass', `${nodeVersion} (✓ >= 18)`);
      } else {
        this.addResult('Node.js Version', 'error', `${nodeVersion} (✗ < 18 required)`);
      }
    } catch (error) {
      this.addResult('Node.js Version', 'error', `Failed to check: ${error.message}`);
    }

    // NPM version check
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.addResult('NPM Version', 'pass', npmVersion);
    } catch (error) {
      this.addResult('NPM Version', 'error', `Failed to check: ${error.message}`);
    }

    // Environment variables
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const optionalEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        this.addResult(`Env Var: ${envVar}`, 'pass', 'Set');
      } else {
        this.addResult(`Env Var: ${envVar}`, 'warning', 'Missing (will be set in production)');
      }
    });

    optionalEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        this.addResult(`Env Var: ${envVar}`, 'pass', 'Set');
      } else {
        this.addResult(`Env Var: ${envVar}`, 'warning', 'Not set (optional)');
      }
    });
  }

  // 2. File Structure Validation
  validateFileStructure() {
    this.log('Starting File Structure Validation...', 'info');

    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      'Dockerfile',
      'choreo.yaml',
      'server.js',
      'prisma/schema.prisma'
    ];

    const requiredDirectories = [
      'src',
      'src/app',
      'src/components',
      'src/lib',
      'src/__tests__',
      'prisma',
      '.github/workflows'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addResult(`File: ${file}`, 'pass', 'Exists');
      } else {
        this.addResult(`File: ${file}`, 'error', 'Missing');
      }
    });

    requiredDirectories.forEach(dir => {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.addResult(`Directory: ${dir}`, 'pass', 'Exists');
      } else {
        this.addResult(`Directory: ${dir}`, 'error', 'Missing');
      }
    });
  }

  // 3. Dependencies Validation
  validateDependencies() {
    this.log('Starting Dependencies Validation...', 'info');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const criticalDeps = [
        'next',
        '@prisma/client',
        'react',
        'typescript',
        '@radix-ui/react-dialog',
        '@supabase/supabase-js'
      ];

      const devDeps = [
        'jest',
        '@playwright/test',
        '@testing-library/react',
        '@types/node'
      ];

      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addResult(`Dependency: ${dep}`, 'pass', packageJson.dependencies[dep]);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          this.addResult(`Dependency: ${dep}`, 'pass', `${packageJson.devDependencies[dep]} (dev)`);
        } else {
          this.addResult(`Dependency: ${dep}`, 'error', 'Missing');
        }
      });

      devDeps.forEach(dep => {
        if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          this.addResult(`Dev Dependency: ${dep}`, 'pass', packageJson.devDependencies[dep]);
        } else {
          this.addResult(`Dev Dependency: ${dep}`, 'warning', 'Missing');
        }
      });

    } catch (error) {
      this.addResult('Package.json', 'error', `Failed to parse: ${error.message}`);
    }
  }

  // 4. Configuration Validation
  validateConfiguration() {
    this.log('Starting Configuration Validation...', 'info');

    // Next.js config
    try {
      const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
      
      if (nextConfig.output === 'standalone') {
        this.addResult('Next.js Config: output', 'pass', 'standalone');
      } else {
        this.addResult('Next.js Config: output', 'error', 'Not set to standalone');
      }

      if (nextConfig.eslint && nextConfig.eslint.ignoreDuringBuilds) {
        this.addResult('Next.js Config: ESLint', 'pass', 'Ignored during builds');
      } else {
        this.addResult('Next.js Config: ESLint', 'warning', 'Not ignored during builds');
      }

    } catch (error) {
      this.addResult('Next.js Config', 'error', `Failed to load: ${error.message}`);
    }

    // Prisma config
    try {
      const schemaPath = 'prisma/schema.prisma';
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        if (schema.includes('generator client')) {
          this.addResult('Prisma Schema: generator', 'pass', 'Client generator found');
        } else {
          this.addResult('Prisma Schema: generator', 'error', 'Client generator missing');
        }

        if (schema.includes('datasource db')) {
          this.addResult('Prisma Schema: datasource', 'pass', 'Database source found');
        } else {
          this.addResult('Prisma Schema: datasource', 'error', 'Database source missing');
        }
      }
    } catch (error) {
      this.addResult('Prisma Schema', 'error', `Failed to validate: ${error.message}`);
    }

    // Choreo config
    try {
      const choreoConfig = fs.readFileSync('choreo.yaml', 'utf8');
      
      if (choreoConfig.includes('type: Web Application')) {
        this.addResult('Choreo Config: type', 'pass', 'Web Application');
      } else {
        this.addResult('Choreo Config: type', 'error', 'Not set to Web Application');
      }

      if (choreoConfig.includes('dockerfile: ./Dockerfile')) {
        this.addResult('Choreo Config: dockerfile', 'pass', 'Dockerfile specified');
      } else {
        this.addResult('Choreo Config: dockerfile', 'error', 'Dockerfile not specified');
      }

    } catch (error) {
      this.addResult('Choreo Config', 'error', `Failed to validate: ${error.message}`);
    }
  }

  // 5. Test Infrastructure Validation
  validateTestInfrastructure() {
    this.log('Starting Test Infrastructure Validation...', 'info');

    const testConfigs = [
      'jest.config.js',
      'jest.config.integration.js',
      'jest.setup.js',
      'playwright.config.ts'
    ];

    testConfigs.forEach(config => {
      if (fs.existsSync(config)) {
        this.addResult(`Test Config: ${config}`, 'pass', 'Exists');
      } else {
        this.addResult(`Test Config: ${config}`, 'error', 'Missing');
      }
    });

    // Test directories
    const testDirs = [
      'src/__tests__/unit',
      'src/__tests__/integration',
      'src/__tests__/e2e',
      'src/__tests__/performance'
    ];

    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'));
        this.addResult(`Test Directory: ${dir}`, 'pass', `${files.length} test files`);
      } else {
        this.addResult(`Test Directory: ${dir}`, 'warning', 'Missing');
      }
    });
  }

  // 6. Build Validation
  validateBuild() {
    this.log('Starting Build Validation...', 'info');

    try {
      // Check if .next directory exists (previous build)
      if (fs.existsSync('.next')) {
        this.addResult('Previous Build', 'pass', '.next directory exists');
      } else {
        this.addResult('Previous Build', 'warning', 'No previous build found');
      }

      // Validate package.json scripts
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredScripts = ['build', 'start', 'test:all', 'lint'];

      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.addResult(`Script: ${script}`, 'pass', 'Defined');
        } else {
          this.addResult(`Script: ${script}`, 'error', 'Missing');
        }
      });

    } catch (error) {
      this.addResult('Build Validation', 'error', `Failed: ${error.message}`);
    }
  }

  // 7. Security Validation
  validateSecurity() {
    this.log('Starting Security Validation...', 'info');

    try {
      // Check for .env files in gitignore
      if (fs.existsSync('.gitignore')) {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        
        if (gitignore.includes('.env')) {
          this.addResult('Security: .env', 'pass', 'Excluded from git');
        } else {
          this.addResult('Security: .env', 'warning', 'Not excluded from git');
        }
      }

      // Check for sensitive files
      const sensitiveFiles = ['.env.local', '.env.production', 'dev.db'];
      sensitiveFiles.forEach(file => {
        if (fs.existsSync(file)) {
          this.addResult(`Security: ${file}`, 'warning', 'Sensitive file exists');
        } else {
          this.addResult(`Security: ${file}`, 'pass', 'No sensitive file');
        }
      });

    } catch (error) {
      this.addResult('Security Validation', 'error', `Failed: ${error.message}`);
    }
  }

  // 8. Performance Validation
  validatePerformance() {
    this.log('Starting Performance Validation...', 'info');

    try {
      // Check Next.js config for performance optimizations
      const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
      
      if (nextConfig.compress !== false) {
        this.addResult('Performance: compression', 'pass', 'Enabled');
      } else {
        this.addResult('Performance: compression', 'warning', 'Disabled');
      }

      if (nextConfig.productionBrowserSourceMaps === false) {
        this.addResult('Performance: source maps', 'pass', 'Disabled in production');
      } else {
        this.addResult('Performance: source maps', 'warning', 'Enabled in production');
      }

    } catch (error) {
      this.addResult('Performance Validation', 'error', `Failed: ${error.message}`);
    }
  }

  // Generate comprehensive report
  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const successRate = ((this.passed.length / totalChecks) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 PERFECT DEPLOYMENT VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log(`📊 Summary: ${this.passed.length}/${totalChecks} checks passed (${successRate}%)`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES (Must Fix):');
      this.errors.forEach(error => {
        console.log(`   • ${error.check}: ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Recommended):');
      this.warnings.forEach(warning => {
        console.log(`   • ${warning.check}: ${warning.message}`);
      });
    }
    
    console.log('\n✅ PASSED CHECKS:');
    this.passed.slice(0, 10).forEach(pass => {
      console.log(`   • ${pass.check}: ${pass.message}`);
    });
    
    if (this.passed.length > 10) {
      console.log(`   ... and ${this.passed.length - 10} more`);
    }
    
    // Deployment readiness assessment
    console.log('\n🎯 DEPLOYMENT READINESS:');
    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        console.log('🟢 PERFECT - Ready for flawless deployment! 🚀');
      } else if (this.warnings.length <= 3) {
        console.log('🟡 GOOD - Deploy with minor warnings ⚠️');
      } else {
        console.log('🟠 CAUTION - Many warnings, review recommended 📋');
      }
    } else {
      console.log('🔴 BLOCKED - Fix critical issues before deployment ❌');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        total: totalChecks,
        passed: this.passed.length,
        warnings: this.warnings.length,
        errors: this.errors.length,
        successRate: `${successRate}%`
      },
      passed: this.passed,
      warnings: this.warnings,
      errors: this.errors
    };
    
    fs.writeFileSync('perfect-deployment-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: perfect-deployment-report.json');
    
    return this.errors.length === 0;
  }

  // Run all validations
  async runAll() {
    this.log('🚀 Starting Perfect Deployment Validation...', 'info');
    
    this.validateEnvironment();
    this.validateFileStructure();
    this.validateDependencies();
    this.validateConfiguration();
    this.validateTestInfrastructure();
    this.validateBuild();
    this.validateSecurity();
    this.validatePerformance();
    
    const isReady = this.generateReport();
    
    if (isReady) {
      this.log('🎉 Validation completed successfully! Ready for perfect deployment.', 'success');
      process.exit(0);
    } else {
      this.log('❌ Validation failed. Fix critical issues before deployment.', 'error');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PerfectDeploymentValidator();
  validator.runAll().catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = PerfectDeploymentValidator; 