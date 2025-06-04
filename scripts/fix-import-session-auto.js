// Script to automatically detect environment and apply the correct ImportSession fix
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function detectDatabaseType() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Try PostgreSQL-specific query first
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT current_database() as database`);
      await prisma.$disconnect();
      return 'postgresql';
    } catch (pgError) {
      // If PostgreSQL query fails, try SQLite-specific query
      try {
        const result = await prisma.$queryRawUnsafe(`PRAGMA database_list`);
        await prisma.$disconnect();
        return 'sqlite';
      } catch (sqliteError) {
        console.error('Could not determine database type:', sqliteError);
        await prisma.$disconnect();
        return 'unknown';
      }
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return 'unknown';
  }
}

async function main() {
  console.log('🔍 Detecting database type...');
  
  // Determine the database type
  const dbType = await detectDatabaseType();
  
  console.log(`✅ Detected database type: ${dbType}`);
  
  // Check environment variables as additional hints
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.CHOREO_DEPLOYMENT === 'true';
  
  console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  // Choose the appropriate fix script
  let fixScript;
  if (dbType === 'postgresql' || isProduction) {
    console.log('🚀 Using PostgreSQL fix script...');
    fixScript = 'fix:import-session-postgres';
  } else {
    console.log('🚀 Using SQLite fix script...');
    fixScript = 'fix:import-session';
  }
  
  // Run the appropriate fix script
  try {
    console.log(`⚙️ Running ${fixScript}...`);
    execSync(`npm run ${fixScript}`, { stdio: 'inherit' });
    console.log('✅ Fix completed successfully!');
  } catch (error) {
    console.error('❌ Error running fix script:', error);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 