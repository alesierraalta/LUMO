-- Check if fileName column exists and add it if it doesn't
-- SQLite compatible version

-- Add fileName column if it doesn't exist
ALTER TABLE "ImportSession" ADD COLUMN "fileName" TEXT;

-- Update existing records to use the basename of filePath
UPDATE "ImportSession" 
SET "fileName" = substr("filePath", instr("filePath", '/') * -1 + 1)
WHERE "fileName" IS NULL; 