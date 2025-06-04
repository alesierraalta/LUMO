// Script to apply the ImportSession table fix
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Starting ImportSession table fix script...');
  
  // Create a Prisma client instance
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to the database');
    
    console.log('Applying migration fix...');
    
    // Add the fileName column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ImportSession" ADD COLUMN "fileName" TEXT;`);
      console.log('Added fileName column to ImportSession table');
    } catch (alterError) {
      // If the column already exists, this will error, which is okay
      console.log('Column may already exist or table doesn\'t exist:', alterError.message);
    }
    
    // Update existing records
    try {
      const updateResult = await prisma.$executeRawUnsafe(`
        UPDATE "ImportSession" 
        SET "fileName" = substr("filePath", instr("filePath", '/') * -1 + 1)
        WHERE "fileName" IS NULL;
      `);
      console.log('Updated existing records');
    } catch (updateError) {
      console.log('Error updating records:', updateError.message);
    }
    
    console.log('Migration fix completed');
    
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