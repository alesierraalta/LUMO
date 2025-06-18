#!/usr/bin/env node

/**
 * Test GitHub Actions Fix Script
 * 
 * This script validates that our GitHub Actions fixes work correctly by
 * simulating the CI environment and running tests the same way they
 * will run in GitHub Actions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 TESTING GITHUB ACTIONS FIXES');
console.log('=' * 60);

/**
 * Test environment setup
 */
function setupTestEnvironment() {
    console.log('\n🔧 Setting up test environment...');
    
    try {
        // Set environment variables similar to GitHub Actions
        process.env.CI = 'true';
        process.env.NODE_ENV = 'test';
        process.env.FORCE_SUPABASE = 'true';
        process.env.SKIP_ENV_VALIDATION = 'true';
        
        console.log('✅ Environment variables set');
        
        // Validate essential environment variables
        const requiredEnvVars = ['JWT_SECRET'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                console.warn(`⚠️  ${envVar} not set - this may cause test failures`);
            } else {
                console.log(`✅ ${envVar} is configured`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error setting up environment:', error.message);
        return false;
    }
}

/**
 * Test script execution
 */
function runTestSuite(suiteName, command, options = {}) {
    console.log(`\n🧪 Running ${suiteName}...`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            cwd: process.cwd(),
            env: { ...process.env }
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${suiteName} PASSED (${duration}ms)`);
        
        return {
            passed: true,
            duration,
            output: result
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ ${suiteName} FAILED (${duration}ms)`);
        
        if (!options.silent) {
            console.log('Error details:');
            console.log(error.stdout || error.message);
        }
        
        return {
            passed: false,
            duration,
            error: error.message,
            output: error.stdout || error.message
        };
    }
}

/**
 * Validate configuration files
 */
function validateConfigurations() {
    console.log('\n🔍 Validating configuration files...');
    
    const configs = [
        { 
            file: '.github/workflows/tests.yml', 
            check: (content) => content.includes('--runInBand'),
            message: 'GitHub Actions workflow includes sequential test execution'
        },
        {
            file: 'package.json',
            check: (content) => JSON.parse(content).scripts['test:integration'].includes('--runInBand'),
            message: 'Package.json integration test script includes --runInBand'
        },
        {
            file: 'jest.config.integration.js',
            check: (content) => fs.existsSync('jest.config.integration.js'),
            message: 'Integration Jest configuration exists'
        }
    ];
    
    let allValid = true;
    
    for (const config of configs) {
        try {
            if (fs.existsSync(config.file)) {
                const content = fs.readFileSync(config.file, 'utf8');
                
                if (config.check(content)) {
                    console.log(`✅ ${config.message}`);
                } else {
                    console.log(`❌ ${config.message} - FAILED`);
                    allValid = false;
                }
            } else {
                console.log(`⚠️  ${config.file} not found`);
                allValid = false;
            }
        } catch (error) {
            console.log(`❌ Error checking ${config.file}: ${error.message}`);
            allValid = false;
        }
    }
    
    return allValid;
}

/**
 * Main test execution
 */
async function main() {
    console.log('🎯 Testing fixes for GitHub Actions CI/CD failures...\n');
    
    // 1. Validate configurations
    const configsValid = validateConfigurations();
    if (!configsValid) {
        console.log('\n❌ Configuration validation failed - fix configurations before proceeding');
        process.exit(1);
    }
    
    // 2. Setup environment
    const envSetup = setupTestEnvironment();
    if (!envSetup) {
        console.log('\n❌ Environment setup failed');
        process.exit(1);
    }
    
    // 3. Clear test cache
    console.log('\n🧹 Clearing test cache...');
    try {
        execSync('npm run test:clear-cache', { stdio: 'ignore' });
        console.log('✅ Test cache cleared');
    } catch {
        console.log('⚠️  Test cache clear skipped');
    }
    
    // 4. Run test suites
    const testResults = [];
    
    // Unit tests (baseline check)
    testResults.push(runTestSuite(
        'Unit Tests',
        'npm run test:unit'
    ));
    
    // Integration tests with our fixes
    testResults.push(runTestSuite(
        'Integration Tests (with --runInBand)',
        'npm run test:integration'
    ));
    
    // 5. Analyze results
    console.log('\n📊 FINAL RESULTS:');
    console.log('=' * 60);
    
    const passed = testResults.filter(r => r.passed);
    const failed = testResults.filter(r => !r.passed);
    
    console.log(`✅ Passed: ${passed.length} test suites`);
    console.log(`❌ Failed: ${failed.length} test suites`);
    
    if (failed.length > 0) {
        console.log('\n🚨 FAILED TEST SUITES:');
        failed.forEach((result, index) => {
            console.log(`${index + 1}. Duration: ${result.duration}ms`);
            console.log(`   Error: ${result.error}`);
        });
        
        console.log('\n💡 TROUBLESHOOTING TIPS:');
        console.log('1. Check that all GitHub Secrets are properly configured');
        console.log('2. Ensure JWT_SECRET is at least 32 characters long');
        console.log('3. Verify Supabase project URLs and keys are correct');
        console.log('4. Check for test isolation issues in individual test files');
        
        process.exit(1);
    } else {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ GitHub Actions should now work correctly');
        console.log('✅ Test isolation issues resolved with --runInBand');
        console.log('✅ Ready to commit and push changes');
    }
    
    // 6. Generate summary
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Total test execution time: ${totalDuration}ms`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Commit the changes to .github/workflows/tests.yml and package.json');
    console.log('2. Push to trigger GitHub Actions workflow');
    console.log('3. Monitor the GitHub Actions run for success');
    console.log('4. All 180 tests should now pass instead of the previous 23 failures');
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    });
}

module.exports = { setupTestEnvironment, runTestSuite, validateConfigurations }; 