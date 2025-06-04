// Choreo preflight script to ensure all database tables are properly configured
// This script runs before the main application to fix common issues

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running Choreo preflight checks...');

// Check environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
console.log(`📊 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Verify PostgreSQL schema is selected in production
if (isProduction) {
  console.log('🔍 Verifying PostgreSQL schema is selected...');
  
  try {
    // Check schema.prisma provider
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schema.includes('provider = "postgresql"')) {
      console.log('⚠️ PostgreSQL schema not selected, selecting it now...');
      execSync('npm run schema:postgresql', { stdio: 'inherit' });
    } else {
      console.log('✅ PostgreSQL schema is correctly selected');
    }
  } catch (error) {
    console.error('❌ Error checking Prisma schema:', error);
  }
}

// Run database fixes
console.log('🛠️ Running database fixes...');

// 1. Run Import Session fix
console.log('🔧 Fixing ImportSession table...');
try {
  execSync('node scripts/fix-import-session-postgres.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error fixing ImportSession table:', error);
}

// 2. Ensure Prisma client is generated
console.log('🔄 Ensuring Prisma client is generated...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error generating Prisma client:', error);
}

// 3. Run database push to ensure schema is applied
console.log('⬆️ Pushing database schema...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error pushing database schema:', error);
}

// All done!
console.log('✅ Choreo preflight checks completed');
console.log('🚀 Ready to start application');

// Exit successfully - this script is meant to be run as a separate process
process.exit(0); 