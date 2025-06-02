const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting database schema update...');

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

// 3. Update the schema.prisma with our new models
console.log('Executing SQL directly to create the necessary tables...');

// SQL for creating ImportSession table
const createImportSessionTable = `
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

CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
`;

// SQL for creating ImportSessionDetail table
const createImportSessionDetailTable = `
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

CREATE INDEX IF NOT EXISTS "ImportSessionDetail_sessionId_idx" ON "ImportSessionDetail"("sessionId");
CREATE INDEX IF NOT EXISTS "ImportSessionDetail_status_idx" ON "ImportSessionDetail"("status");
`;

// Run the SQL commands directly
try {
  // 4. Create a temporary SQL file
  const sqlFilePath = path.join(process.cwd(), 'temp-migration.sql');
  fs.writeFileSync(sqlFilePath, createImportSessionTable + createImportSessionDetailTable);
  
  // 5. Execute the SQL commands
  console.log('Executing SQL...');
  const dbPath = path.join(process.cwd(), 'prisma/dev.db');
  execSync(`sqlite3 "${dbPath}" < "${sqlFilePath}"`);
  
  // 6. Clean up temporary file
  fs.unlinkSync(sqlFilePath);
  
  console.log('Database schema updated successfully!');
  
  // 7. Update user model to add the import sessions relation
  console.log('NOTE: You need to manually add the importSessions field to the User model in your code.');
  
} catch (error) {
  console.error('Error updating database schema:', error);
  
  // Restore the migration lock file if there was an error
  if (fs.existsSync(migrationLockPath + '.backup')) {
    console.log('Restoring migration lock file...');
    const backupContent = fs.readFileSync(migrationLockPath + '.backup', 'utf8');
    fs.writeFileSync(migrationLockPath, backupContent);
  }
} 