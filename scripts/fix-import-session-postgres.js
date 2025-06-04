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
      
      console.log('Checking if ImportSession table exists and has proper columns...');
      
      // Check if the table exists
      const tableCheck = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'ImportSession'
        ) as exists
      `);
      
      const tableExists = tableCheck[0].exists;
      
      if (tableExists) {
        console.log('ImportSession table exists, checking columns...');
        
        // Check required columns
        const requiredColumns = ['id', 'fileName', 'filePath', 'status', 'notes', 'totalItems', 
                               'successItems', 'warningItems', 'errorItems', 'createdById', 
                               'createdAt', 'completedAt'];
        
        const columnCheck = await prisma.$queryRawUnsafe(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'ImportSession'
        `);
        
        // Extract column names from the result
        const existingColumns = columnCheck.map(col => col.column_name);
        
        // Find missing columns
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('Missing columns detected:', missingColumns);
          
          // Option 1: Try to add missing columns
          try {
            console.log('Attempting to add missing columns...');
            
            for (const column of missingColumns) {
              let dataType = 'TEXT';
              
              // Set appropriate data types
              if (column === 'totalItems' || column === 'successItems' || 
                  column === 'warningItems' || column === 'errorItems') {
                dataType = 'INTEGER NOT NULL DEFAULT 0';
              } else if (column === 'createdAt') {
                dataType = 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP';
              } else if (column === 'completedAt') {
                dataType = 'TIMESTAMP';
              } else if (column === 'status') {
                dataType = "TEXT NOT NULL DEFAULT 'processing'";
              } else {
                dataType = 'TEXT';
              }
              
              await prisma.$executeRawUnsafe(`
                ALTER TABLE "ImportSession" ADD COLUMN "${column}" ${dataType}
              `);
              
              console.log(`Added column ${column} with type ${dataType}`);
            }
            
            console.log('✅ All missing columns have been added');
          } catch (alterError) {
            console.error('Error adding columns:', alterError);
            
            // Option 2: If altering fails, recreate the table with backup
            console.log('Recreating the ImportSession table...');
            
            // Backup existing data
            try {
              await prisma.$executeRawUnsafe(`
                CREATE TABLE "ImportSession_backup" AS 
                SELECT * FROM "ImportSession"
              `);
              console.log('✅ Created backup of existing data');
            } catch (backupError) {
              console.error('Error creating backup:', backupError);
            }
            
            // Drop and recreate the table
            try {
              await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ImportSession_old"`);
              await prisma.$executeRawUnsafe(`ALTER TABLE "ImportSession" RENAME TO "ImportSession_old"`);
              
              // Create new table with all required columns
              await prisma.$executeRawUnsafe(`
                CREATE TABLE "ImportSession" (
                  "id" TEXT PRIMARY KEY,
                  "fileName" TEXT NOT NULL,
                  "filePath" TEXT NOT NULL,
                  "status" TEXT NOT NULL DEFAULT 'processing',
                  "notes" TEXT,
                  "totalItems" INTEGER NOT NULL DEFAULT 0,
                  "successItems" INTEGER NOT NULL DEFAULT 0,
                  "warningItems" INTEGER NOT NULL DEFAULT 0,
                  "errorItems" INTEGER NOT NULL DEFAULT 0,
                  "createdById" TEXT NOT NULL,
                  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  "completedAt" TIMESTAMP,
                  FOREIGN KEY ("createdById") REFERENCES "users"("id")
                )
              `);
              
              // Create indexes
              await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
                CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
              `);
              
              console.log('✅ Recreated ImportSession table with all required columns');
              
              // Try to migrate data from old table
              try {
                // Get columns from old table
                const oldColumns = await prisma.$queryRawUnsafe(`
                  SELECT column_name
                  FROM information_schema.columns
                  WHERE table_name = 'ImportSession_old'
                `);
                
                const validOldColumns = oldColumns
                  .map(col => col.column_name)
                  .filter(col => requiredColumns.includes(col));
                
                if (validOldColumns.length > 0) {
                  console.log('Migrating data from old table...', validOldColumns);
                  
                  // Create a dynamic INSERT statement based on available columns
                  const columnList = validOldColumns.join(', ');
                  
                  await prisma.$executeRawUnsafe(`
                    INSERT INTO "ImportSession" (${columnList})
                    SELECT ${columnList} FROM "ImportSession_old"
                  `);
                  
                  console.log('✅ Migrated existing data to new table');
                }
              } catch (migrateError) {
                console.error('Error migrating data:', migrateError);
              }
            } catch (recreateError) {
              console.error('Error recreating table:', recreateError);
            }
          }
        } else {
          console.log('✅ ImportSession table has all required columns');
        }
      } else {
        console.log('ImportSession table does not exist, creating it...');
        
        // Create the table from scratch
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "ImportSession" (
            "id" TEXT PRIMARY KEY,
            "fileName" TEXT NOT NULL,
            "filePath" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'processing',
            "notes" TEXT,
            "totalItems" INTEGER NOT NULL DEFAULT 0,
            "successItems" INTEGER NOT NULL DEFAULT 0,
            "warningItems" INTEGER NOT NULL DEFAULT 0,
            "errorItems" INTEGER NOT NULL DEFAULT 0,
            "createdById" TEXT NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "completedAt" TIMESTAMP,
            FOREIGN KEY ("createdById") REFERENCES "users"("id")
          )
        `);
        
        // Create indexes
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
          CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
        `);
        
        console.log('✅ Created ImportSession table with all required columns');
      }
      
      // Also ensure ImportSessionDetail table exists
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSessionDetail" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "sku" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "message" TEXT,
          "originalData" TEXT NOT NULL,
          "importedData" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("sessionId") REFERENCES "ImportSession"("id") ON DELETE CASCADE
        )
      `);
      
      // Create indexes for ImportSessionDetail
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ImportSessionDetail_sessionId_idx" ON "ImportSessionDetail"("sessionId");
        CREATE INDEX IF NOT EXISTS "ImportSessionDetail_status_idx" ON "ImportSessionDetail"("status");
      `);
      
      console.log('✅ Ensured ImportSessionDetail table exists with all required columns');
      
    } catch (dbError) {
      console.error('Error executing PostgreSQL queries:', dbError);
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