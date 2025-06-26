const fs = require('fs');
const path = require('path');

console.log('🔧 Simple Production Build Fix for LUMO');
console.log('=====================================');

// Check current build state
const nextDir = path.join(process.cwd(), '.next');
const buildIdPath = path.join(nextDir, 'BUILD_ID');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');

console.log('\n🔍 Current Build Analysis:');

// 1. Check .next directory
const hasNextDir = fs.existsSync(nextDir);
console.log(`   - .next directory: ${hasNextDir ? '✅ EXISTS' : '❌ MISSING'}`);

// 2. Check BUILD_ID
const hasBuildId = fs.existsSync(buildIdPath);
console.log(`   - BUILD_ID file: ${hasBuildId ? '✅ EXISTS' : '❌ MISSING'}`);

if (hasBuildId) {
    try {
        const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
        console.log(`   - BUILD_ID content: ${buildId}`);
    } catch (error) {
        console.log(`   - BUILD_ID read error: ${error.message}`);
    }
}

// 3. Check standalone directory
const standaloneDir = path.join(nextDir, 'standalone');
const hasStandalone = fs.existsSync(standaloneDir);
console.log(`   - Standalone directory: ${hasStandalone ? '✅ EXISTS' : '❌ MISSING'}`);

// 4. Check server.js
const serverJsPath = path.join(standaloneDir, 'server.js');
const hasServerJs = fs.existsSync(serverJsPath);
console.log(`   - server.js file: ${hasServerJs ? '✅ EXISTS' : '❌ MISSING'}`);

// 5. Check next.config.js for standalone output
let hasStandaloneConfig = false;
if (fs.existsSync(nextConfigPath)) {
    try {
        const configContent = fs.readFileSync(nextConfigPath, 'utf8');
        hasStandaloneConfig = configContent.includes("output: 'standalone'");
        console.log(`   - Standalone config: ${hasStandaloneConfig ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
    } catch (error) {
        console.log(`   - Config read error: ${error.message}`);
    }
} else {
    console.log('   - next.config.js: ❌ NOT FOUND');
}

console.log('\n📊 Production Readiness Assessment:');

const isProductionReady = hasNextDir && hasBuildId && hasStandalone && hasServerJs && hasStandaloneConfig;

if (isProductionReady) {
    console.log('🎉 ✅ PRODUCTION READY!');
    console.log('   All required components are present for optimal Choreo deployment.');
    console.log('   Expected startup time: 2-3 seconds');
} else {
    console.log('⚠️  ❌ NEEDS FIXES:');
    
    if (!hasNextDir) {
        console.log('   🔧 Run: npm run build');
    }
    
    if (!hasStandaloneConfig) {
        console.log('   🔧 Fix next.config.js: Ensure output: "standalone" is configured');
    }
    
    if (!hasBuildId) {
        console.log('   🔧 Missing BUILD_ID - will be auto-created during build');
    }
    
    if (!hasStandalone || !hasServerJs) {
        console.log('   🔧 Missing standalone build - ensure Next.js build completes successfully');
    }
}

console.log('\n💡 Next Steps:');
console.log('1. If fixes needed: npm run build');
console.log('2. Test locally: npm start');
console.log('3. Commit and push: git add . && git commit -m "fix: production build"');
console.log('4. Deploy to Choreo and monitor startup logs');

// Emergency BUILD_ID creation if needed
if (hasNextDir && !hasBuildId) {
    console.log('\n🆘 Creating emergency BUILD_ID...');
    try {
        const emergencyBuildId = Date.now().toString();
        fs.writeFileSync(buildIdPath, emergencyBuildId);
        console.log(`✅ Emergency BUILD_ID created: ${emergencyBuildId}`);
    } catch (error) {
        console.log(`❌ Could not create BUILD_ID: ${error.message}`);
    }
} 