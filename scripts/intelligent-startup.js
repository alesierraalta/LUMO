#!/usr/bin/env node

/**
 * INTELLIGENT STARTUP SCRIPT
 * Handles production/development detection and server startup without shell scripts
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 LUMO Intelligent Startup - Node.js Only');
console.log('==========================================');

// Environment detection
const currentEnv = process.env.NODE_ENV || 'development';
const choreoEnv = process.env.CHOREO_ENVIRONMENT || 'unknown';
const currentDir = process.cwd();

console.log('🔍 Environment Analysis:');
console.log(`   - NODE_ENV: ${currentEnv}`);
console.log(`   - CHOREO_ENVIRONMENT: ${choreoEnv}`);
console.log(`   - Current directory: ${currentDir}`);

// Check for standalone build
console.log('\n🔍 Checking for standalone build...');

const standaloneServerPath = path.join(currentDir, 'server.js');
const buildIdPath = path.join(currentDir, '.next', 'BUILD_ID');
const customServerPath = path.join(currentDir, 'custom-server.js');
const productionServerPath = path.join(currentDir, 'production-server.js');
const safeServerPath = path.join(currentDir, 'safe-server.js');

const hasStandaloneServer = fs.existsSync(standaloneServerPath);
const hasBuildId = fs.existsSync(buildIdPath);
const hasCustomServer = fs.existsSync(customServerPath);
const hasProductionServer = fs.existsSync(productionServerPath);
const hasSafeServer = fs.existsSync(safeServerPath);

console.log(`   - Standalone server.js: ${hasStandaloneServer ? '✅' : '❌'}`);
console.log(`   - BUILD_ID file: ${hasBuildId ? '✅' : '❌'}`);
console.log(`   - Custom server: ${hasCustomServer ? '✅' : '❌'}`);
console.log(`   - Production server: ${hasProductionServer ? '✅' : '❌'}`);
console.log(`   - Safe server: ${hasSafeServer ? '✅' : '❌'}`);

if (hasBuildId) {
    try {
        const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
        console.log(`   - BUILD_ID content: ${buildId}`);
    } catch (error) {
        console.log(`   - BUILD_ID read error: ${error.message}`);
    }
}

console.log('\n📊 Startup Decision Matrix:');

// Function to run runtime setup first
async function runRuntimeSetup() {
    console.log('🔧 Running runtime setup...');
    
    const runtimeSetupPath = path.join(currentDir, 'scripts', 'choreo-runtime-setup.js');
    
    if (fs.existsSync(runtimeSetupPath)) {
        try {
            require(runtimeSetupPath);
            console.log('✅ Runtime setup completed');
        } catch (error) {
            console.log(`⚠️ Runtime setup had issues: ${error.message}`);
        }
    } else {
        console.log('⚠️ Runtime setup script not found, continuing...');
    }
}

// Function to start server
function startServer(serverPath, description, expectedTime) {
    console.log(`🚀 ${description}`);
    console.log(`⏱️ Expected startup: ${expectedTime}`);
    
    const serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: process.env
    });
    
    serverProcess.on('error', (error) => {
        console.error(`❌ Server startup error: ${error.message}`);
        process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
        console.log(`🔄 Server exited with code: ${code}`);
        if (code !== 0) {
            process.exit(code);
        }
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
        console.log('📴 Received SIGTERM, shutting down gracefully...');
        serverProcess.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
        console.log('📴 Received SIGINT, shutting down gracefully...');
        serverProcess.kill('SIGINT');
    });
}

// Main startup logic
async function main() {
    // Always run runtime setup first
    await runRuntimeSetup();
    
    if (currentEnv === 'production') {
        console.log('🎯 PRODUCTION MODE DETECTED');
        
        if (hasProductionServer) {
            startServer(productionServerPath, 'Starting production server with entryCSSFiles protection (optimal)', '5-10 seconds');
        } else if (hasSafeServer) {
            startServer(safeServerPath, 'Starting safe server with entryCSSFiles protection (optimal)', '5-10 seconds');
        } else if (hasStandaloneServer && hasBuildId) {
            startServer(standaloneServerPath, 'Starting standalone server (fallback)', '2-3 seconds');
        } else if (hasCustomServer) {
            startServer(customServerPath, 'Starting custom server (fallback)', '10-15 seconds');
        } else {
            console.log('❌ CRITICAL: No server available in production');
            console.log('🔍 Available files:');
            try {
                const files = fs.readdirSync(currentDir);
                console.log(files.filter(f => f.includes('server')).join(', '));
            } catch (error) {
                console.log(`Error listing files: ${error.message}`);
            }
            
            // Check if we have the emergency standalone server
            const emergencyServerPath = path.join(currentDir, 'emergency-standalone-server.js');
            if (fs.existsSync(emergencyServerPath)) {
                console.log('🚨 Using emergency standalone server (bypasses Next.js completely)...');
                startServer(emergencyServerPath, 'Starting emergency standalone server (no Next.js)', '2-3 seconds');
            } else {
                console.log('🆘 Creating emergency server...');
                createEmergencyServer();
            }
        }
    } else {
        console.log('🧪 DEVELOPMENT MODE DETECTED');
        
        if (hasStandaloneServer && hasBuildId) {
            startServer(standaloneServerPath, 'Starting standalone server (development with optimizations)', '5-10 seconds');
        } else if (hasCustomServer) {
            startServer(customServerPath, 'Starting custom Next.js server (development)', '15-30 seconds');
        } else {
            console.log('🧪 Creating development server...');
            createDevelopmentServer();
        }
    }
}

// Emergency server creation
function createEmergencyServer() {
    const emergencyServerCode = `
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 8080;

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(\`✅ Emergency server ready on http://0.0.0.0:\${port}\`);
  });
});
`;
    
    const emergencyPath = path.join(currentDir, 'emergency-server.js');
    fs.writeFileSync(emergencyPath, emergencyServerCode);
    console.log('🆘 Emergency server created');
    
    startServer(emergencyPath, 'Starting emergency server', '20-40 seconds');
}

// Development server creation
function createDevelopmentServer() {
    const devServerCode = `
const { createServer } = require('http');
const next = require('next');

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 8080;

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(\`✅ Development server ready on http://0.0.0.0:\${port}\`);
  });
});
`;
    
    const devPath = path.join(currentDir, 'dev-server.js');
    fs.writeFileSync(devPath, devServerCode);
    console.log('🧪 Development server created');
    
    startServer(devPath, 'Starting development server', '15-30 seconds');
}

// Run main function
main().catch((error) => {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
}); 