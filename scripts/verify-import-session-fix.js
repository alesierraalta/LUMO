// Script to verify that the ImportSession table has the fileName column
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Verifying ImportSession table structure...');
  
  // Create a Prisma client instance
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to the database');
    
    // Try to query ImportSession to see if it works
    try {
      // Create a test record with fileName field
      const testId = 'test-' + Date.now();
      const createResult = await prisma.prisma.$executeRaw`
        INSERT INTO "ImportSession" (
          "id", "fileName", "filePath", "status", "notes", "createdById", "createdAt",
          "totalItems", "successItems", "warningItems", "errorItems"
        ) VALUES (
          ${testId}, 'test-file.csv', '/tmp/test-file.csv', 'test', 'Test record', 'test-user', datetime('now'),
          0, 0, 0, 0
        )
      `;
      
      console.log('✅ Successfully created test record with fileName');
      
      // Delete the test record
      await prisma.prisma.$executeRaw`DELETE FROM "ImportSession" WHERE "id" = ${testId}`;
      console.log('✅ Successfully deleted test record');
      
      console.log('✅ Verification completed: ImportSession table structure is correct');
    } catch (queryError) {
      console.error('❌ Error testing ImportSession table:', queryError);
      console.log('The table may not be fixed correctly or may not exist.');
    }
  } catch (error) {
    console.error('Error during verification:', error);
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