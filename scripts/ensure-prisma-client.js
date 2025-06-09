const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Prisma client...');

// Detect if we're in a build environment
const isBuildTime = (
  process.env.NODE_ENV === undefined || // Buildpacks don't set NODE_ENV during install
  process.env.CI === 'true' || // CI environment
  process.env.BUILDPACK === 'true' || // Buildpack environment
  !process.env.DATABASE_URL // No DATABASE_URL available
);

// Path to the Prisma client runtime file that's missing
const prismaClientPath = path.join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client',
  'index.js'
);

// Check if the Prisma client exists
const prismaClientExists = fs.existsSync(prismaClientPath);

if (!prismaClientExists) {
  console.log('⚠️  Prisma client not found. Generating...');
  try {
    if (isBuildTime) {
      // During build time, generate without database connection
      console.log('🔨 Build time - generating Prisma client without database connection');
      execSync('npx prisma generate', { stdio: 'inherit' });
    } else {
      // During runtime, use the no-engine flag
      execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
    }
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    
    // In build time, don't fail - let the application handle it at runtime
    if (isBuildTime) {
      console.log('⚠️ Build time generation failed - will retry at runtime');
      process.exit(0);
    }
    
    process.exit(1);
  }
} else {
  console.log('✅ Prisma client already exists');
}

// Verify the client was generated correctly (only if not in build time)
if (!isBuildTime && !fs.existsSync(prismaClientPath)) {
  console.error('❌ Prisma client generation failed - file not found:', prismaClientPath);
  process.exit(1);
}

if (isBuildTime) {
  console.log('✅ Build-time Prisma client check complete');
} else {
  console.log('✅ Prisma client verification complete');
}
