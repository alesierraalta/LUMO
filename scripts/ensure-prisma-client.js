const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Prisma client...');

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
    // Run prisma generate
    execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Prisma client already exists');
}

// Verify the client was generated correctly
if (!fs.existsSync(prismaClientPath)) {
  console.error('❌ Prisma client generation failed - file not found:', prismaClientPath);
  process.exit(1);
}

console.log('✅ Prisma client verification complete');
