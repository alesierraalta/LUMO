
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
