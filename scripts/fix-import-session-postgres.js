// Script to fix the ImportSession table in PostgreSQL environments (Choreo)
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Starting ImportSession table fix for PostgreSQL...');
  
  // Create a Prisma client instance
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to the database');
    
    console.log('Checking database provider...');
    // Check if we're using PostgreSQL
    try {
      // Try a PostgreSQL-specific query
      const result = await prisma.$queryRawUnsafe(`
        SELECT current_database() as database, current_user as user
      `);
      console.log('Connected to PostgreSQL database:', result);
      
      console.log('Applying PostgreSQL-specific fix...');
      
      // Check if the fileName column exists
      const columnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'ImportSession'
        AND column_name = 'fileName'
      `);
      
      if (Array.isArray(columnCheck) && columnCheck.length === 0) {
        console.log('fileName column does not exist, adding it...');
        
        // Add the fileName column
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "ImportSession" ADD COLUMN "fileName" TEXT;
        `);
        
        // Update existing records
        await prisma.$executeRawUnsafe(`
          UPDATE "ImportSession" 
          SET "fileName" = split_part("filePath", '/', -1)
          WHERE "fileName" IS NULL;
        `);
        
        // Add NOT NULL constraint
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "ImportSession" ALTER COLUMN "fileName" SET NOT NULL;
        `);
        
        console.log('✅ Added fileName column and updated existing records');
      } else {
        console.log('✅ fileName column already exists');
      }
      
    } catch (dbError) {
      console.error('Not connected to PostgreSQL or error executing query:', dbError);
    }
    
  } catch (error) {
    console.error('Error applying migration fix:', error);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('Disconnected from the database');
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 