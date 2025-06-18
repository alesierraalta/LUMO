#!/usr/bin/env node

/**
 * GitHub Actions Test Failures Fix Script
 * Validates environment setup and provides troubleshooting
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 GitHub Actions Test Failures Fix Validator\n');

// Check if GitHub Actions workflow exists and is updated
function checkWorkflowFile() {
    const workflowPath = '.github/workflows/tests.yml';
    console.log('📂 Checking GitHub Actions workflow...');
    
    if (!fs.existsSync(workflowPath)) {
        console.log('❌ GitHub Actions workflow not found');
        return false;
    }
    
    const content = fs.readFileSync(workflowPath, 'utf8');
    
    // Check for key improvements
    const checks = [
        { name: 'Node.js 20', pattern: "NODE_VERSION: '20'" },
        { name: 'JWT_SECRET configuration', pattern: 'JWT_SECRET' },
        { name: 'Build caching', pattern: 'actions/cache@v4' },
        { name: 'Environment validation', pattern: 'Validate Environment Setup' },
        { name: 'All test suites', pattern: 'test:performance' }
    ];
    
    let passed = 0;
    checks.forEach(check => {
        if (content.includes(check.pattern)) {
            console.log(`✅ ${check.name}`);
            passed++;
        } else {
            console.log(`❌ ${check.name}`);
        }
    });
    
    console.log(`\n📊 Workflow checks: ${passed}/${checks.length} passed\n`);
    return passed === checks.length;
}

// Check required secrets documentation
function checkSecretsGuide() {
    console.log('📋 Checking secrets documentation...');
    
    const guidePath = 'docs/GITHUB_ACTIONS_FIX.md';
    if (fs.existsSync(guidePath)) {
        console.log('✅ GitHub Actions fix guide created');
        console.log('📝 Next step: Add required secrets to GitHub repository');
        return true;
    } else {
        console.log('❌ GitHub Actions fix guide missing');
        return false;
    }
}

// Check package.json test scripts
function checkTestScripts() {
    console.log('🧪 Checking test scripts configuration...');
    
    const packagePath = 'package.json';
    if (!fs.existsSync(packagePath)) {
        console.log('❌ package.json not found');
        return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = [
        'test:unit',
        'test:integration', 
        'test:e2e',
        'test:performance',
        'test:setup',
        'test:health'
    ];
    
    let found = 0;
    requiredScripts.forEach(script => {
        if (scripts[script]) {
            console.log(`✅ ${script}`);
            found++;
        } else {
            console.log(`❌ ${script}`);
        }
    });
    
    console.log(`\n📊 Test scripts: ${found}/${requiredScripts.length} found\n`);
    return found === requiredScripts.length;
}

// Validate local environment
function validateLocalEnvironment() {
    console.log('🔍 Validating local environment...');
    
    const envVars = [
        'SUPABASE_URL',
        'SUPABASE_KEY', 
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'JWT_SECRET'
    ];
    
    let found = 0;
    envVars.forEach(envVar => {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar} (${process.env[envVar].length} chars)`);
            found++;
        } else {
            console.log(`❌ ${envVar} (missing)`);
        }
    });
    
    console.log(`\n📊 Environment variables: ${found}/${envVars.length} configured\n`);
    return found >= 4; // JWT_SECRET might be missing locally
}

// Generate required secrets template
function generateSecretsTemplate() {
    console.log('🔑 GitHub Secrets Required:\n');
    
    const secrets = [
        {
            name: 'SUPABASE_URL_PROD',
            value: 'https://ubjujxtvlubxowsphvuk.supabase.co',
            description: 'Production Supabase URL'
        },
        {
            name: 'SUPABASE_KEY_PROD', 
            value: 'your_production_anon_key',
            description: 'Production Supabase anon key'
        },
        {
            name: 'SUPABASE_URL_DEV',
            value: 'https://ndprriqyhddjoixrlqnz.supabase.co', 
            description: 'Development Supabase URL'
        },
        {
            name: 'SUPABASE_KEY_DEV',
            value: 'your_development_anon_key',
            description: 'Development Supabase anon key'
        },
        {
            name: 'JWT_SECRET',
            value: 'your_super_secure_jwt_secret_minimum_32_chars',
            description: 'JWT authentication secret (32+ characters)'
        }
    ];
    
    secrets.forEach(secret => {
        console.log(`📌 ${secret.name}`);
        console.log(`   ${secret.description}`);
        console.log(`   Value: ${secret.value}\n`);
    });
}

// Main execution
async function main() {
    try {
        const workflowOk = checkWorkflowFile();
        const scriptsOk = checkTestScripts();
        const secretsOk = checkSecretsGuide();
        const envOk = validateLocalEnvironment();
        
        console.log('📋 Summary:');
        console.log(`✅ GitHub Actions workflow: ${workflowOk ? 'UPDATED' : 'NEEDS UPDATE'}`);
        console.log(`✅ Test scripts: ${scriptsOk ? 'CONFIGURED' : 'MISSING'}`);
        console.log(`✅ Secrets guide: ${secretsOk ? 'CREATED' : 'MISSING'}`);
        console.log(`✅ Local environment: ${envOk ? 'GOOD' : 'INCOMPLETE'}`);
        
        if (workflowOk && scriptsOk && secretsOk) {
            console.log('\n🎉 GitHub Actions fix is ready!');
            console.log('\n📝 Next steps:');
            console.log('1. Add required secrets to GitHub repository');
            console.log('2. Push changes to trigger updated workflow');
            console.log('3. Monitor test results in Actions tab');
            
            console.log('\n🔑 Required GitHub Secrets:');
            generateSecretsTemplate();
            
        } else {
            console.log('\n⚠️  Some components need attention. Check the details above.');
        }
        
    } catch (error) {
        console.error('❌ Error during validation:', error.message);
        process.exit(1);
    }
}

main(); 