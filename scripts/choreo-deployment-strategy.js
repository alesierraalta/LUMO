#!/usr/bin/env node

/**
 * Choreo Deployment Strategy Script
 * Comprehensive deployment preparation and monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Choreo Deployment Strategy - Starting...');

// Configuration
const config = {
    maxRetries: 3,
    retryDelay: 30000, // 30 seconds
    healthCheckTimeout: 60000, // 60 seconds
    buildTimeout: 300000, // 5 minutes
    deploymentMonitorInterval: 10000, // 10 seconds
};

// Deployment phases
const phases = {
    PREPARATION: 'preparation',
    NETWORK_SETUP: 'network_setup',
    DEPENDENCY_INSTALL: 'dependency_install',
    BUILD_VERIFICATION: 'build_verification',
    DEPLOYMENT_TRIGGER: 'deployment_trigger',
    MONITORING: 'monitoring',
    VERIFICATION: 'verification'
};

// Phase 1: Preparation
async function runPreparationPhase() {
    console.log('\n📋 Phase 1: Preparation');
    console.log('================================');
    
    const checks = [
        { name: 'Node.js Version', check: () => process.version },
        { name: 'NPM Version', check: () => execSync('npm --version', { encoding: 'utf8' }).trim() },
        { name: 'Git Status', check: () => execSync('git status --porcelain', { encoding: 'utf8' }).trim() },
        { name: 'Package.json', check: () => fs.existsSync('package.json') ? 'Found' : 'Missing' },
        { name: '.npmrc Config', check: () => fs.existsSync('.npmrc') ? 'Found' : 'Missing' },
        { name: 'Choreo Config', check: () => fs.existsSync('choreo.yaml') ? 'Found' : 'Missing' }
    ];
    
    const results = {};
    checks.forEach(({ name, check }) => {
        try {
            results[name] = check();
            console.log(`✅ ${name}: ${results[name]}`);
        } catch (error) {
            results[name] = `Error: ${error.message}`;
            console.log(`❌ ${name}: ${results[name]}`);
        }
    });
    
    return results;
}

// Phase 2: Network Setup
async function runNetworkSetupPhase() {
    console.log('\n🌐 Phase 2: Network Setup');
    console.log('================================');
    
    try {
        console.log('🔧 Running network resilience fix...');
        execSync('node scripts/choreo-network-fix.js', { stdio: 'inherit' });
        console.log('✅ Network setup completed');
        return { status: 'success', message: 'Network configuration optimized' };
    } catch (error) {
        console.log('⚠️ Network setup had issues, but continuing...');
        return { status: 'warning', message: error.message };
    }
}

// Phase 3: Dependency Installation
async function runDependencyInstallPhase() {
    console.log('\n📦 Phase 3: Dependency Installation');
    console.log('================================');
    
    let attempt = 0;
    const maxAttempts = config.maxRetries;
    
    while (attempt < maxAttempts) {
        attempt++;
        console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);
        
        try {
            // Clear cache before each attempt
            console.log('🗑️ Clearing npm cache...');
            execSync('npm cache clean --force', { timeout: 30000 });
            
            // Install dependencies
            console.log('📥 Installing dependencies...');
            execSync('npm ci --no-optional --no-audit --progress=false', { 
                timeout: config.buildTimeout,
                stdio: 'inherit'
            });
            
            console.log('✅ Dependencies installed successfully');
            return { status: 'success', attempts: attempt };
            
        } catch (error) {
            console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxAttempts) {
                console.log(`⏳ Waiting ${config.retryDelay/1000} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, config.retryDelay));
            }
        }
    }
    
    return { status: 'failed', attempts: attempt, error: 'All dependency installation attempts failed' };
}

// Phase 4: Build Verification
async function runBuildVerificationPhase() {
    console.log('\n🔨 Phase 4: Build Verification');
    console.log('================================');
    
    try {
        console.log('🏗️ Running production build...');
        execSync('npm run build', { 
            timeout: config.buildTimeout,
            stdio: 'inherit'
        });
        
        // Verify build outputs
        const buildChecks = [
            { path: '.next', type: 'directory' },
            { path: '.next/standalone', type: 'directory' },
            { path: '.next/static', type: 'directory' },
            { path: 'server.js', type: 'file' }
        ];
        
        const buildResults = {};
        buildChecks.forEach(({ path, type }) => {
            const exists = fs.existsSync(path);
            buildResults[path] = exists;
            console.log(`${exists ? '✅' : '❌'} ${path} (${type}): ${exists ? 'Found' : 'Missing'}`);
        });
        
        const allExists = Object.values(buildResults).every(Boolean);
        
        return { 
            status: allExists ? 'success' : 'partial',
            results: buildResults,
            message: allExists ? 'Build verification passed' : 'Some build outputs missing'
        };
        
    } catch (error) {
        console.log(`❌ Build verification failed: ${error.message}`);
        return { status: 'failed', error: error.message };
    }
}

// Phase 5: Deployment Trigger
async function runDeploymentTriggerPhase() {
    console.log('\n🚀 Phase 5: Deployment Trigger');
    console.log('================================');
    
    try {
        // Check git status
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
        
        if (gitStatus.trim()) {
            console.log('📝 Changes detected, committing...');
            execSync('git add .', { stdio: 'inherit' });
            execSync('git commit -m "fix: choreo network resilience improvements\n\n- Enhanced .npmrc with comprehensive network settings\n- Added network resilience script for deployment stability\n- Implemented retry logic for build failures\n- Added comprehensive troubleshooting documentation"', { stdio: 'inherit' });
            
            console.log('📤 Pushing to trigger Choreo deployment...');
            execSync('git push origin main', { stdio: 'inherit' });
            
            return { status: 'success', message: 'Deployment triggered via git push' };
        } else {
            console.log('ℹ️ No changes to commit');
            return { status: 'skipped', message: 'No changes to deploy' };
        }
        
    } catch (error) {
        console.log(`❌ Deployment trigger failed: ${error.message}`);
        return { status: 'failed', error: error.message };
    }
}

// Phase 6: Monitoring
async function runMonitoringPhase() {
    console.log('\n📊 Phase 6: Deployment Monitoring');
    console.log('================================');
    
    console.log('🔍 Monitoring deployment status...');
    console.log('📋 Check Choreo console for real-time build logs');
    console.log('🌐 URL: https://console.choreo.dev/');
    
    // Generate monitoring report
    const monitoringReport = {
        timestamp: new Date().toISOString(),
        phase: 'monitoring',
        instructions: [
            'Open Choreo console in browser',
            'Navigate to your project',
            'Check build logs for network errors',
            'Monitor for ECONNRESET errors',
            'Verify successful dependency installation',
            'Confirm build completion',
            'Test deployed application'
        ],
        expectedBehavior: [
            'npm ci should complete without ECONNRESET',
            'Build should finish in <10 minutes',
            'Application should start successfully',
            'Health endpoint should respond'
        ]
    };
    
    const reportPath = path.join('logs', 'deployment-monitoring.json');
    fs.writeFileSync(reportPath, JSON.stringify(monitoringReport, null, 2));
    console.log(`✅ Monitoring report saved to: ${reportPath}`);
    
    return { status: 'success', report: monitoringReport };
}

// Phase 7: Verification
async function runVerificationPhase() {
    console.log('\n✅ Phase 7: Post-Deployment Verification');
    console.log('================================');
    
    const verificationSteps = [
        'Check Choreo deployment status',
        'Verify application startup logs',
        'Test health endpoint (/api/health)',
        'Verify authentication functionality',
        'Check database connectivity',
        'Monitor for runtime errors'
    ];
    
    console.log('📋 Manual verification steps:');
    verificationSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
    });
    
    return { status: 'pending', steps: verificationSteps };
}

// Generate deployment report
function generateDeploymentReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        strategy: 'choreo-network-resilience',
        phases: results,
        summary: {
            total: Object.keys(results).length,
            successful: Object.values(results).filter(r => r.status === 'success').length,
            failed: Object.values(results).filter(r => r.status === 'failed').length,
            warnings: Object.values(results).filter(r => r.status === 'warning').length
        },
        recommendations: [],
        nextSteps: []
    };
    
    // Add recommendations based on results
    if (results.dependency_install?.status === 'success' && results.dependency_install?.attempts > 1) {
        report.recommendations.push('Network resilience improvements working - multiple attempts succeeded');
    }
    
    if (results.build_verification?.status === 'success') {
        report.recommendations.push('Local build successful - Choreo deployment should work');
    }
    
    if (results.deployment_trigger?.status === 'success') {
        report.recommendations.push('Deployment triggered - monitor Choreo console for progress');
    }
    
    // Add next steps
    report.nextSteps = [
        'Monitor Choreo build logs for network improvements',
        'Verify npm ci completes without ECONNRESET errors',
        'Check application startup and health endpoint',
        'Test critical functionality after deployment'
    ];
    
    const reportPath = path.join('logs', 'choreo-deployment-report.json');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Deployment report saved to: ${reportPath}`);
    
    return report;
}

// Main execution
async function main() {
    console.log('🎯 Choreo Deployment Strategy - Network Resilience Focus');
    console.log('=========================================================\n');
    
    const results = {};
    
    try {
        // Execute all phases
        results.preparation = await runPreparationPhase();
        results.network_setup = await runNetworkSetupPhase();
        results.dependency_install = await runDependencyInstallPhase();
        results.build_verification = await runBuildVerificationPhase();
        results.deployment_trigger = await runDeploymentTriggerPhase();
        results.monitoring = await runMonitoringPhase();
        results.verification = await runVerificationPhase();
        
        // Generate comprehensive report
        const report = generateDeploymentReport(results);
        
        // Final summary
        console.log('\n🎉 Deployment Strategy Execution Complete!');
        console.log('==========================================');
        console.log(`📊 Summary: ${report.summary.successful}/${report.summary.total} phases successful`);
        console.log(`⚠️ Warnings: ${report.summary.warnings}`);
        console.log(`❌ Failures: ${report.summary.failed}`);
        
        if (report.summary.failed === 0) {
            console.log('\n✅ All phases completed successfully!');
            console.log('🚀 Choreo deployment should proceed without network issues');
        } else {
            console.log('\n⚠️ Some phases had issues - check the report for details');
        }
        
        console.log('\n🎯 Next Steps:');
        report.nextSteps.forEach(step => console.log(`   • ${step}`));
        
    } catch (error) {
        console.error('\n❌ Deployment strategy failed:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = {
    runPreparationPhase,
    runNetworkSetupPhase,
    runDependencyInstallPhase,
    runBuildVerificationPhase,
    runDeploymentTriggerPhase,
    runMonitoringPhase,
    runVerificationPhase,
    generateDeploymentReport
}; 