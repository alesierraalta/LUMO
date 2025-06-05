-- Comprehensive ImportSession schema fix for SQLite
-- This migration ensures the ImportSession table has the correct structure
-- and resolves the fileName/filePath issue in SQLite environments

-- Check if table exists, create if it doesn't
CREATE TABLE IF NOT EXISTS "ImportSession" (
  "id" TEXT PRIMARY KEY,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");

-- SQLite doesn't support ALTER TABLE DROP COLUMN directly
-- We need to create a temporary table with the correct structure, 
-- copy data, drop the old table, and rename the new one

-- First check if fileName column exists
PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Check if we need to perform the migration at all
CREATE TEMPORARY TABLE IF NOT EXISTS "_column_check" AS
SELECT name FROM pragma_table_info('ImportSession') WHERE name = 'fileName';

-- Only do this if we found a fileName column
CREATE TEMPORARY TABLE IF NOT EXISTS "_need_migration" AS
SELECT COUNT(*) as count FROM "_column_check";

-- Create the new table without fileName column
CREATE TABLE IF NOT EXISTS "ImportSession_new" (
  "id" TEXT PRIMARY KEY,
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

-- Check for both fileName and filePath columns
CREATE TEMPORARY TABLE IF NOT EXISTS "_has_fileName" AS
SELECT 1 FROM pragma_table_info('ImportSession') WHERE name = 'fileName';

CREATE TEMPORARY TABLE IF NOT EXISTS "_has_filePath" AS
SELECT 1 FROM pragma_table_info('ImportSession') WHERE name = 'filePath';

-- If we have fileName but not filePath, we need to copy fileName to filePath
-- and then do the migration
INSERT OR IGNORE INTO "ImportSession_new" (
  "id", "filePath", "status", "notes", "totalItems", 
  "successItems", "warningItems", "errorItems", 
  "createdById", "createdAt", "completedAt"
)
SELECT 
  "id", 
  CASE 
    WHEN EXISTS (SELECT 1 FROM "_has_fileName") AND NOT EXISTS (SELECT 1 FROM "_has_filePath") 
    THEN "fileName" 
    ELSE "filePath"
  END as "filePath",
  COALESCE("status", 'processing') as "status",
  "notes",
  COALESCE("totalItems", 0) as "totalItems",
  COALESCE("successItems", 0) as "successItems",
  COALESCE("warningItems", 0) as "warningItems",
  COALESCE("errorItems", 0) as "errorItems",
  COALESCE("createdById", "userId") as "createdById",
  COALESCE("createdAt", CURRENT_TIMESTAMP) as "createdAt",
  "completedAt"
FROM "ImportSession"
WHERE EXISTS (SELECT 1 FROM "_need_migration" WHERE count > 0);

-- Drop old table and rename new one
DROP TABLE IF EXISTS "ImportSession";
ALTER TABLE "ImportSession_new" RENAME TO "ImportSession";

-- Recreate indexes
CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");

COMMIT;

PRAGMA foreign_keys=on;

-- Create ImportSessionDetail table if it doesn't exist
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

-- Create ImportSessionDetail indexes
CREATE INDEX IF NOT EXISTS "ImportSessionDetail_sessionId_idx" ON "ImportSessionDetail"("sessionId");
CREATE INDEX IF NOT EXISTS "ImportSessionDetail_status_idx" ON "ImportSessionDetail"("status"); 