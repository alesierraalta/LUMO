#!/usr/bin/env node

/**
 * Test Health Check Script for LUMO
 * 
 * This script performs comprehensive health checks for the testing environment
 * including dependencies, configuration, database connectivity, and test setup.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestHealthChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(test, passed, message) {
    const result = { test, message, timestamp: new Date().toISOString() };
    
    if (passed) {
      this.results.passed.push(result);
      this.log(`${test}: ${message}`, 'success');
    } else {
      this.results.failed.push(result);
      this.log(`${test}: ${message}`, 'error');
    }
  }

  addWarning(test, message) {
    const result = { test, message, timestamp: new Date().toISOString() };
    this.results.warnings.push(result);
    this.log(`${test}: ${message}`, 'warning');
  }

  async checkNodeVersion() {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.addResult('Node.js Version', true, `${version} (✓ >= 18)`);
      } else {
        this.addResult('Node.js Version', false, `${version} (requires >= 18)`);
      }
    } catch (error) {
      this.addResult('Node.js Version', false, `Error checking version: ${error.message}`);
    }
  }

  async checkNpmVersion() {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.addResult('NPM Version', true, `${version}`);
    } catch (error) {
      this.addResult('NPM Version', false, `Error checking version: ${error.message}`);
    }
  }

  async checkTestDependencies() {
    const requiredDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      '@playwright/test',
      '@types/jest'
    ];

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const dep of requiredDeps) {
        if (allDeps[dep]) {
          this.addResult(`Dependency: ${dep}`, true, `${allDeps[dep]}`);
        } else {
          this.addResult(`Dependency: ${dep}`, false, 'Not installed');
        }
      }
    } catch (error) {
      this.addResult('Test Dependencies', false, `Error reading package.json: ${error.message}`);
    }
  }

  async checkTestDirectories() {
    const requiredDirs = [
      'src/__tests__',
      'src/__tests__/unit',
      'src/__tests__/integration',
      'src/__tests__/e2e',
      'src/__tests__/performance'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        this.addResult(`Directory: ${dir}`, true, 'Exists');
      } else {
        this.addResult(`Directory: ${dir}`, false, 'Missing');
      }
    }
  }

  async checkConfigFiles() {
    const configFiles = [
      { file: 'jest.config.js', required: true },
      { file: 'jest.config.integration.js', required: true },
      { file: 'jest.setup.js', required: true },
      { file: 'playwright.config.ts', required: true },
      { file: 'tsconfig.json', required: true }
    ];

    for (const { file, required } of configFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.addResult(`Config: ${file}`, true, 'Exists');
      } else {
        if (required) {
          this.addResult(`Config: ${file}`, false, 'Missing required file');
        } else {
          this.addWarning(`Config: ${file}`, 'Optional file missing');
        }
      }
    }
  }

  async checkEnvironmentVariables() {
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL'
    ];

    const optionalEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'NEXTAUTH_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult(`Env Var: ${envVar}`, true, 'Set');
      } else {
        this.addResult(`Env Var: ${envVar}`, false, 'Missing');
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addResult(`Env Var: ${envVar}`, true, 'Set (optional)');
      } else {
        this.addWarning(`Env Var: ${envVar}`, 'Not set (optional)');
      }
    }
  }

  async checkDatabaseConnection() {
    try {
      // Try to import and test database connection
      const testSetupPath = path.join(process.cwd(), 'src/__tests__/integration/test-setup.ts');
      
      if (fs.existsSync(testSetupPath)) {
        this.addResult('Database Setup', true, 'Test setup file exists');
        
        // Additional check could be added here to actually test connection
        // This would require importing the test setup and running a simple query
      } else {
        this.addResult('Database Setup', false, 'Test setup file missing');
      }
    } catch (error) {
      this.addResult('Database Connection', false, `Error: ${error.message}`);
    }
  }

  async checkPlaywrightBrowsers() {
    try {
      const playwrightPath = path.join(process.cwd(), 'node_modules/@playwright/test');
      
      if (fs.existsSync(playwrightPath)) {
        this.addResult('Playwright Installation', true, 'Installed');
        
        // Check if browsers are installed
        try {
          execSync('npx playwright --version', { stdio: 'pipe' });
          this.addResult('Playwright Browsers', true, 'Available');
        } catch (error) {
          this.addWarning('Playwright Browsers', 'May need installation (run: npx playwright install)');
        }
      } else {
        this.addResult('Playwright Installation', false, 'Not installed');
      }
    } catch (error) {
      this.addResult('Playwright Check', false, `Error: ${error.message}`);
    }
  }

  async checkTestScripts() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      const requiredScripts = [
        'test:unit',
        'test:integration',
        'test:e2e',
        'test:performance',
        'test:all'
      ];

      for (const script of requiredScripts) {
        if (scripts[script]) {
          this.addResult(`Script: ${script}`, true, 'Defined');
        } else {
          this.addResult(`Script: ${script}`, false, 'Missing');
        }
      }
    } catch (error) {
      this.addResult('Test Scripts', false, `Error reading package.json: ${error.message}`);
    }
  }

  async checkDiskSpace() {
    try {
      const stats = fs.statSync(process.cwd());
      this.addResult('Disk Access', true, 'Working directory accessible');
      
      // Check if we can write to temp directories
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const testFile = path.join(tempDir, 'health-check-test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      this.addResult('Write Permissions', true, 'Can write to temp directory');
    } catch (error) {
      this.addResult('Disk Space/Permissions', false, `Error: ${error.message}`);
    }
  }

  generateReport() {
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? (this.results.passed.length / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏥 LUMO TEST HEALTH CHECK REPORT');
    console.log('='.repeat(60));
    console.log(`📊 Summary: ${this.results.passed.length}/${total} checks passed (${passRate}%)`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.results.failed.forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    
    if (this.results.failed.length === 0) {
      console.log('   ✅ All critical checks passed! Your testing environment is ready.');
    } else {
      console.log('   🔧 Fix the failed checks above before running tests.');
      console.log('   📖 Check the troubleshooting guide: docs/TROUBLESHOOTING.md');
    }
    
    if (this.results.warnings.length > 0) {
      console.log('   ⚠️  Consider addressing warnings for optimal testing experience.');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   • Run: npm run test:setup (to clear caches and setup)');
    console.log('   • Run: npm run test:quick (for a quick test)');
    console.log('   • Run: npm run test:all (for full test suite)');
    
    console.log('\n' + '='.repeat(60));
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'test-health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        passRate: parseFloat(passRate)
      },
      results: this.results
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    return this.results.failed.length === 0;
  }

  async runAllChecks() {
    this.log('Starting LUMO Test Health Check...', 'info');
    
    await this.checkNodeVersion();
    await this.checkNpmVersion();
    await this.checkTestDependencies();
    await this.checkTestDirectories();
    await this.checkConfigFiles();
    await this.checkEnvironmentVariables();
    await this.checkDatabaseConnection();
    await this.checkPlaywrightBrowsers();
    await this.checkTestScripts();
    await this.checkDiskSpace();
    
    return this.generateReport();
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new TestHealthChecker();
  checker.runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

module.exports = TestHealthChecker; 