#!/usr/bin/env node

/**
 * PRODUCTION BUILD FIX
 * Ensures standalone build and BUILD_ID are properly generated for production deployment
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔧 PRODUCTION BUILD FIX - Ensuring standalone build...');
console.log('====================================================');

const cwd = process.cwd();
const nextDir = path.join(cwd, '.next');
const buildIdPath = path.join(nextDir, 'BUILD_ID');
const standaloneDir = path.join(nextDir, 'standalone');
const serverJsPath = path.join(standaloneDir, 'server.js');

// Step 1: Check current build state
console.log('🔍 Step 1: Analyzing current build state...');

const hasNextDir = fs.existsSync(nextDir);
const hasBuildId = fs.existsSync(buildIdPath);
const hasStandalone = fs.existsSync(standaloneDir);
const hasServerJs = fs.existsSync(serverJsPath);

console.log(`   - .next directory: ${hasNextDir ? '✅' : '❌'}`);
console.log(`   - BUILD_ID file: ${hasBuildId ? '✅' : '❌'}`);
console.log(`   - Standalone directory: ${hasStandalone ? '✅' : '❌'}`);
console.log(`   - server.js file: ${hasServerJs ? '✅' : '❌'}`);

if (hasBuildId) {
    try {
        const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
        console.log(`   - BUILD_ID content: ${buildId}`);
    } catch (error) {
        console.log(`   - BUILD_ID read error: ${error.message}`);
    }
}

// Step 2: Check next.config.js for standalone output
console.log('\n🔍 Step 2: Verifying next.config.js...');
const nextConfigPath = path.join(cwd, 'next.config.js');

if (fs.existsSync(nextConfigPath)) {
    try {
        const configContent = fs.readFileSync(nextConfigPath, 'utf8');
        if (configContent.includes("output: 'standalone'")) {
            console.log('   ✅ Standalone output is configured');
        } else {
            console.log('   ❌ Standalone output NOT configured');
            
            // Fix next.config.js if needed
            console.log('🔧 Adding standalone output to next.config.js...');
            const fixedConfig = configContent.replace(
                /(\/\*\* @type \{import\('next'\)\.NextConfig\} \*\/\s*const nextConfig = \{)/,
                '$1\n  output: \'standalone\',\n'
            );
            
            if (fixedConfig !== configContent) {
                fs.writeFileSync(nextConfigPath, fixedConfig);
                console.log('   ✅ Fixed next.config.js');
            }
        }
    } catch (error) {
        console.log(`   ❌ Error reading next.config.js: ${error.message}`);
    }
} else {
    console.log('   ❌ next.config.js not found');
}

// Step 3: Force rebuild if necessary
const needsRebuild = !hasBuildId || !hasStandalone || !hasServerJs;

if (needsRebuild) {
    console.log('\n🔨 Step 3: Force rebuilding with standalone output...');
    
    // Clean existing build
    if (hasNextDir) {
        console.log('🧹 Cleaning existing .next directory...');
        fs.rmSync(nextDir, { recursive: true, force: true });
    }
    
    // Set environment variables for build
    const buildEnv = {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        STANDALONE: 'true'
    };
    
    console.log('🔨 Running Next.js build with standalone output...');
    
    return new Promise((resolve, reject) => {
        const buildProcess = spawn('npx', ['next', 'build'], {
            stdio: 'inherit',
            shell: true,
            cwd: cwd,
            env: buildEnv
        });
        
        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Build completed successfully!');
                verifyBuildResult();
                resolve();
            } else {
                console.error(`\n❌ Build failed with exit code ${code}`);
                
                // Try to create minimal BUILD_ID as emergency fallback
                if (!fs.existsSync(nextDir)) {
                    fs.mkdirSync(nextDir, { recursive: true });
                }
                
                if (!fs.existsSync(buildIdPath)) {
                    const emergencyBuildId = Date.now().toString();
                    fs.writeFileSync(buildIdPath, emergencyBuildId);
                    console.log(`🆘 Created emergency BUILD_ID: ${emergencyBuildId}`);
                }
                
                reject(new Error(`Build process failed with code ${code}`));
            }
        });
        
        buildProcess.on('error', (error) => {
            console.error(`❌ Build process error: ${error.message}`);
            reject(error);
        });
    });
} else {
    console.log('\n✅ Step 3: Build state is correct, no rebuild needed');
    verifyBuildResult();
}

function verifyBuildResult() {
    console.log('\n🔍 Final Verification:');
    console.log('=====================');
    
    const finalHasNextDir = fs.existsSync(nextDir);
    const finalHasBuildId = fs.existsSync(buildIdPath);
    const finalHasStandalone = fs.existsSync(standaloneDir);
    const finalHasServerJs = fs.existsSync(serverJsPath);
    
    console.log(`   - .next directory: ${finalHasNextDir ? '✅' : '❌'}`);
    console.log(`   - BUILD_ID file: ${finalHasBuildId ? '✅' : '❌'}`);
    console.log(`   - Standalone directory: ${finalHasStandalone ? '✅' : '❌'}`);
    console.log(`   - server.js file: ${finalHasServerJs ? '✅' : '❌'}`);
    
    if (finalHasBuildId) {
        try {
            const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
            console.log(`   - BUILD_ID content: ${buildId}`);
        } catch (error) {
            console.log(`   - BUILD_ID read error: ${error.message}`);
        }
    }
    
    if (finalHasStandalone) {
        try {
            const standaloneFiles = fs.readdirSync(standaloneDir);
            console.log(`   - Standalone files: ${standaloneFiles.slice(0, 5).join(', ')}${standaloneFiles.length > 5 ? '...' : ''}`);
        } catch (error) {
            console.log(`   - Standalone read error: ${error.message}`);
        }
    }
    
    // Check if everything is ready for production
    const isProductionReady = finalHasNextDir && finalHasBuildId && finalHasStandalone && finalHasServerJs;
    
    console.log('\n📊 Production Readiness Status:');
    if (isProductionReady) {
        console.log('🎉 SUCCESS: Build is ready for production deployment!');
        console.log('💡 Next steps:');
        console.log('   1. Commit these changes');
        console.log('   2. Push to repository');
        console.log('   3. Deploy to Choreo');
        console.log('   4. Expect 2-3 second startup time');
    } else {
        console.log('❌ ISSUES: Build is not ready for production');
        console.log('🔧 Required actions:');
        if (!finalHasBuildId) console.log('   - Fix BUILD_ID generation');
        if (!finalHasStandalone) console.log('   - Fix standalone output generation');
        if (!finalHasServerJs) console.log('   - Fix server.js creation');
    }
}

// For script execution
if (require.main === module) {
    // Script is being run directly
} 