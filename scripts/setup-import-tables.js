// This script creates the necessary tables for the import functionality
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('Setting up import tables...');

  // 1. Backup the migration lock file
  const migrationLockPath = path.join(process.cwd(), 'prisma/migrations/migration_lock.toml');
  if (fs.existsSync(migrationLockPath)) {
    console.log('Backing up migration lock file...');
    const lockContent = fs.readFileSync(migrationLockPath, 'utf8');
    fs.writeFileSync(migrationLockPath + '.backup', lockContent);
    
    // 2. Update the provider in the migration lock file
    console.log('Updating migration lock file provider to sqlite...');
    const updatedContent = lockContent.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(migrationLockPath, updatedContent);
  }

  try {
    // 3. Create tables using raw SQL through Prisma
    console.log('Creating ImportSession table...');
    await prisma.$executeRaw`
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
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" DATETIME,
        FOREIGN KEY ("createdById") REFERENCES "users"("id")
      );
    `;

    console.log('Creating ImportSession indexes...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
    `;

    console.log('Creating ImportSessionDetail table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ImportSessionDetail" (
        "id" TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "message" TEXT,
        "originalData" TEXT NOT NULL,
        "importedData" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("sessionId") REFERENCES "ImportSession"("id") ON DELETE CASCADE
      );
    `;

    console.log('Creating ImportSessionDetail indexes...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ImportSessionDetail_sessionId_idx" ON "ImportSessionDetail"("sessionId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ImportSessionDetail_status_idx" ON "ImportSessionDetail"("status");
    `;

    console.log('Import tables created successfully!');
    
    // 4. Update Prisma schema to include the new models
    console.log('NOTE: You need to manually update your Prisma code to work with these new tables.');
    console.log('Make sure to add the importSessions field to the User model and update the PrismaClient extensions.');

  } catch (error) {
    console.error('Error setting up import tables:', error);
    
    // Restore the migration lock file if there was an error
    if (fs.existsSync(migrationLockPath + '.backup')) {
      console.log('Restoring migration lock file...');
      const backupContent = fs.readFileSync(migrationLockPath + '.backup', 'utf8');
      fs.writeFileSync(migrationLockPath, backupContent);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 