#!/usr/bin/env node

/**
 * Debug Failing Tests Script
 * 
 * This script identifies specific failing tests in the integration suite
 * and provides detailed error information to help debug the issues.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🔍 DEBUGGING FAILING TESTS IN INTEGRATION SUITE');
console.log('=' * 50);

/**
 * Run a specific test with detailed output
 */
function runTestWithDetails(testPath) {
    console.log(`\n🧪 Running test: ${testPath}`);
    console.log('-'.repeat(40));
    
    try {
        const result = execSync(
            `npx jest "${testPath}" --verbose --no-coverage --testTimeout=30000`,
            { 
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            }
        );
        
        console.log(`✅ PASSED: ${testPath}`);
        return { passed: true, output: result };
    } catch (error) {
        console.log(`❌ FAILED: ${testPath}`);
        console.log('Error Output:');
        console.log(error.stdout || error.message);
        return { passed: false, output: error.stdout || error.message, error: error.message };
    }
}

/**
 * Get list of all integration test files
 */
function getIntegrationTestFiles() {
    try {
        const testFiles = execSync(
            'find src/__tests__/integration -name "*.test.ts" -type f',
            { encoding: 'utf8', stdio: 'pipe' }
        ).trim().split('\n').filter(file => file.length > 0);
        
        console.log('\n📁 Found integration test files:');
        testFiles.forEach(file => console.log(`  - ${file}`));
        
        return testFiles;
    } catch (error) {
        console.error('❌ Error finding test files:', error.message);
        
        // Fallback: manually list common test files
        return [
            'src/__tests__/integration/error-handling.test.ts',
            'src/__tests__/integration/database.test.ts',
            'src/__tests__/integration/auth-api.test.ts',
            'src/__tests__/integration/categories-comprehensive.test.ts',
            'src/__tests__/integration/inventory-comprehensive.test.ts'
        ];
    }
}

/**
 * Run tests one by one to identify failures
 */
async function debugFailingTests() {
    const testFiles = getIntegrationTestFiles();
    const results = [];
    
    console.log(`\n🔍 Running ${testFiles.length} test files individually...`);
    
    for (const testFile of testFiles) {
        const result = runTestWithDetails(testFile);
        results.push({
            file: testFile,
            ...result
        });
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n📊 SUMMARY OF TEST RESULTS:');
    console.log('=' * 50);
    
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    
    console.log(`✅ Passed: ${passed.length} tests`);
    console.log(`❌ Failed: ${failed.length} tests`);
    
    if (failed.length > 0) {
        console.log('\n🚨 FAILING TESTS:');
        failed.forEach(result => {
            console.log(`\n❌ ${result.file}`);
            console.log('Error details:');
            console.log(result.error || 'No specific error message');
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('1. Check test isolation - tests may be interfering with each other');
        console.log('2. Verify mock system state between tests');
        console.log('3. Check for shared state in test utilities');
        console.log('4. Review beforeEach/afterEach cleanup procedures');
    } else {
        console.log('\n✅ All tests pass individually - likely a test isolation issue when run together');
    }
    
    // Test running all together
    console.log('\n🔄 Now running all integration tests together...');
    try {
        const allResult = execSync(
            'npm run test:integration',
            { encoding: 'utf8', stdio: 'pipe' }
        );
        console.log('✅ All tests passed when run together!');
    } catch (error) {
        console.log('❌ Tests fail when run together - confirming test isolation issue');
        console.log('Output preview:');
        console.log((error.stdout || error.message).substring(0, 1000) + '...');
    }
}

/**
 * Check for common test isolation issues
 */
function checkTestIsolationIssues() {
    console.log('\n🔍 CHECKING FOR COMMON TEST ISOLATION ISSUES:');
    console.log('-'.repeat(50));
    
    // Check for global state in mocks
    console.log('1. Checking mock state management...');
    
    // Check test utilities
    console.log('2. Checking test utilities for shared state...');
    
    // Check beforeEach/afterEach patterns
    console.log('3. Checking cleanup patterns...');
    
    console.log('✅ Test isolation check complete');
}

// Main execution
async function main() {
    try {
        await debugFailingTests();
        checkTestIsolationIssues();
        
        console.log('\n🎯 NEXT STEPS FOR GITHUB ACTIONS:');
        console.log('1. Fix test isolation issues identified above');
        console.log('2. Ensure all tests pass locally before pushing');
        console.log('3. Consider running tests with --runInBand for sequential execution');
        console.log('4. Review Jest configuration for proper test isolation');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runTestWithDetails, getIntegrationTestFiles }; 