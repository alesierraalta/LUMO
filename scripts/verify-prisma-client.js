const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function verifyPrismaClient() {
  console.log('🔍 Verifying Prisma client installation...');

  // Paths to check for Prisma client files
  const prismaPaths = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'index.js'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
    path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'runtime', 'library.js')
  ];

  // Check if any of the required files exist
  const clientExists = prismaPaths.some(p => {
    const exists = fs.existsSync(p);
    console.log(`- ${p}: ${exists ? '✅ Found' : '❌ Missing'}`);
    return exists;
  });

  if (!clientExists) {
    console.error('❌ Prisma client is not properly installed');
    console.log('Attempting to generate Prisma client...');
    
    try {
      // Try to generate the client
      execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
      
      // Check again after generation
      const regenerated = prismaPaths.some(p => fs.existsSync(p));
      if (regenerated) {
        console.log('✅ Successfully generated Prisma client');
      } else {
        console.error('❌ Failed to generate Prisma client');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error generating Prisma client:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Prisma client is properly installed');
  }

  // Verify we can require the client
  try {
    console.log('\n🔍 Testing Prisma client import...');
    const { PrismaClient } = require('@prisma/client');
    console.log('✅ Prisma client imports successfully');
    
    // Skip database connection test during build time
    console.log('⚠️ Skipping database connection test during build time');
      
  } catch (error) {
    console.error('❌ Error testing Prisma client:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Prisma client verification complete');
}

// Run the verification
verifyPrismaClient().catch(error => {
  console.error('❌ Error in Prisma client verification:', error.message);
  process.exit(1);
});
