#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Prisma-aware build process...');

const startTime = Date.now();

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isChoreo = process.env.CHOREO_PROJECT || process.env.DEPLOY_ENV === 'choreo';
const buildEnv = isChoreo ? 'choreo' : (isProduction ? 'production' : 'development');

console.log(`📍 Build Environment: ${buildEnv}`);
console.log(`🎯 Production: ${isProduction ? 'YES' : 'NO'}`);
console.log(`☁️ Choreo: ${isChoreo ? 'YES' : 'NO'}`);

// Database URL analysis
const getDatabaseInfo = () => {
  const databaseUrl = process.env.DATABASE_URL || '';
  const isSQLite = databaseUrl.startsWith('file:');
  const isPostgreSQL = databaseUrl.startsWith('postgres') || databaseUrl.startsWith('postgresql:');
  const isAccelerate = databaseUrl.startsWith('prisma://');
  
  return {
    url: databaseUrl ? '[REDACTED]' : 'NOT_SET',
    isSQLite,
    isPostgreSQL,
    isAccelerate,
    type: isSQLite ? 'sqlite' : isPostgreSQL ? 'postgresql' : isAccelerate ? 'accelerate' : 'unknown'
  };
};

const dbInfo = getDatabaseInfo();
console.log(`🔗 Database Type: ${dbInfo.type}`);

// Step 1: Clean existing Prisma files
console.log('\n📁 Step 1: Cleaning existing Prisma files...');
try {
  const prismaClientPath = path.join(process.cwd(), 'node_modules/.prisma');
  if (fs.existsSync(prismaClientPath)) {
    execSync(`rm -rf "${prismaClientPath}"`, { stdio: 'inherit' });
    console.log('✅ Cleaned existing Prisma client');
  }
  
  const generatedPath = path.join(process.cwd(), 'prisma/generated');
  if (fs.existsSync(generatedPath)) {
    execSync(`rm -rf "${generatedPath}"`, { stdio: 'inherit' });
    console.log('✅ Cleaned generated directory');
  }
} catch (error) {
  console.warn('⚠️ Warning: Could not clean some Prisma files:', error.message);
}

// Step 2: Generate Prisma client with environment-specific configuration
console.log('\n🔧 Step 2: Generating Prisma client...');
try {
  // Generate client with appropriate engine based on detected environment
  if (dbInfo.isAccelerate) {
    console.log('📡 Detected Accelerate URL - generating client with Accelerate support');
    execSync('npx prisma generate', { stdio: 'inherit' });
  } else if (dbInfo.isPostgreSQL) {
    console.log('🐘 Detected PostgreSQL URL - generating client for direct connection');
    execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
  } else if (dbInfo.isSQLite) {
    console.log('📄 Detected SQLite URL - generating client for local database');
    execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
  } else {
    console.log('❓ Unknown database type - generating standard client');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('❌ Prisma client generation failed:', error.message);
  throw error;
}

// Step 3: Create build-time client configuration marker
console.log('\n📝 Step 3: Creating build configuration marker...');
try {
  const buildConfigPath = path.join(process.cwd(), 'prisma/build-config.json');
  const buildConfig = {
    buildTime: new Date().toISOString(),
    buildEnv,
    databaseType: dbInfo.type,
    nodeEnv: process.env.NODE_ENV,
    deployEnv: process.env.DEPLOY_ENV,
    buildId: process.env.GITHUB_SHA || `build-${Date.now()}`,
    prismaVersion: require('@prisma/client/package.json').version,
    generatedFor: dbInfo.isAccelerate ? 'accelerate' : 'direct',
    warnings: []
  };
  
  // Add warnings for potential issues
  if (dbInfo.type === 'unknown' && process.env.DATABASE_URL) {
    buildConfig.warnings.push('Unknown database URL format detected');
  }
  
  if (!process.env.DATABASE_URL && isProduction) {
    buildConfig.warnings.push('No DATABASE_URL set in production build');
  }
  
  fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig, null, 2));
  console.log('✅ Build configuration marker created');
  console.log(`📋 Build Config: ${JSON.stringify(buildConfig, null, 2)}`);
} catch (error) {
  console.warn('⚠️ Warning: Could not create build config marker:', error.message);
}

// Step 4: Install runtime safety hooks
console.log('\n🛡️ Step 4: Installing runtime safety hooks...');
try {
  // Create runtime startup script
  const startupScriptContent = `
const fs = require('fs');
const path = require('path');

// Runtime P6001 Protection Hook
console.log('🛡️ Initializing P6001 Protection...');

const buildConfigPath = path.join(__dirname, 'prisma/build-config.json');
let buildConfig = null;

try {
  if (fs.existsSync(buildConfigPath)) {
    buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
    console.log('📋 Build config loaded:', buildConfig.buildTime, buildConfig.databaseType);
  }
} catch (error) {
  console.warn('⚠️ Could not load build config:', error.message);
}

// Runtime environment analysis
const runtimeDbUrl = process.env.DATABASE_URL || '';
const runtimeDbType = runtimeDbUrl.startsWith('file:') ? 'sqlite' : 
                     runtimeDbUrl.startsWith('postgres') ? 'postgresql' :
                     runtimeDbUrl.startsWith('prisma://') ? 'accelerate' : 'unknown';

console.log(\`🔍 Runtime DB Type: \${runtimeDbType}\`);

// Detect potential P6001 scenario
if (buildConfig && buildConfig.databaseType !== runtimeDbType) {
  console.warn(\`🚨 P6001 RISK DETECTED! Build: \${buildConfig.databaseType}, Runtime: \${runtimeDbType}\`);
  console.warn('🔧 Emergency fix script should handle this automatically');
}

module.exports = { buildConfig, runtimeDbType };
`;

  const startupScriptPath = path.join(process.cwd(), 'scripts/runtime-p6001-protection.js');
  fs.writeFileSync(startupScriptPath, startupScriptContent);
  console.log('✅ Runtime protection hook installed');
} catch (error) {
  console.warn('⚠️ Warning: Could not install runtime hooks:', error.message);
}

// Step 5: Run Next.js build
console.log('\n🏗️ Step 5: Running Next.js build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed successfully');
} catch (error) {
  console.error('❌ Next.js build failed:', error.message);
  throw error;
}

// Step 6: Post-build verification
console.log('\n✅ Step 6: Post-build verification...');
try {
  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    throw new Error('.next directory not found');
  }
  
  // Check if standalone build exists (required for Choreo)
  const standaloneDir = path.join(nextDir, 'standalone');
  if (isChoreo && !fs.existsSync(standaloneDir)) {
    throw new Error('Standalone build not found (required for Choreo)');
  }
  
  // Check if Prisma client exists
  const prismaClientDir = path.join(process.cwd(), 'node_modules/.prisma/client');
  if (!fs.existsSync(prismaClientDir)) {
    console.warn('⚠️ Warning: Prisma client directory not found');
  } else {
    console.log('✅ Prisma client directory verified');
  }
  
  console.log('✅ Post-build verification passed');
} catch (error) {
  console.error('❌ Post-build verification failed:', error.message);
  throw error;
}

const totalTime = Date.now() - startTime;
console.log(`\n🎉 Prisma-aware build completed successfully! (${totalTime}ms)`);
console.log('📦 Build artifacts ready for deployment');

if (buildConfig && buildConfig.warnings.length > 0) {
  console.log('\n⚠️ Build Warnings:');
  buildConfig.warnings.forEach(warning => console.log(`   - ${warning}`));
} 