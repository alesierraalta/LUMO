-- Comprehensive ImportSession schema fix
-- This migration ensures the ImportSession table has the correct structure
-- and resolves the fileName/filePath issue

-- Check if table exists, create if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession'
  ) THEN
    CREATE TABLE "ImportSession" (
      "id" TEXT NOT NULL,
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
      CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
    );
    
    -- Create indexes
    CREATE INDEX "ImportSession_createdById_idx" ON "ImportSession"("createdById");
    CREATE INDEX "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
  END IF;
END
$$;

-- Handle fileName vs filePath inconsistency
DO $$
BEGIN
  -- Check if fileName column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'fileName'
  ) THEN
    -- Check if filePath exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'filePath'
    ) THEN
      -- Add filePath column if it doesn't exist
      ALTER TABLE "ImportSession" ADD COLUMN "filePath" TEXT;
      
      -- Copy data from fileName to filePath
      UPDATE "ImportSession" SET "filePath" = "fileName" WHERE "filePath" IS NULL;
      
      -- Make filePath NOT NULL
      ALTER TABLE "ImportSession" ALTER COLUMN "filePath" SET NOT NULL;
    END IF;
    
    -- Copy any remaining data from fileName to filePath if both exist
    UPDATE "ImportSession" SET "filePath" = "fileName" 
    WHERE "filePath" IS NULL AND "fileName" IS NOT NULL;
    
    -- Remove fileName column
    ALTER TABLE "ImportSession" DROP COLUMN "fileName";
  END IF;
END
$$;

-- Ensure filePath column exists and is NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'filePath'
  ) THEN
    ALTER TABLE "ImportSession" ADD COLUMN "filePath" TEXT NOT NULL DEFAULT '';
  ELSE
    -- Check if it's nullable and make it NOT NULL if needed
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'filePath'
      AND is_nullable = 'YES'
    ) THEN
      -- Update any NULL values first
      UPDATE "ImportSession" SET "filePath" = '' WHERE "filePath" IS NULL;
      -- Then make it NOT NULL
      ALTER TABLE "ImportSession" ALTER COLUMN "filePath" SET NOT NULL;
    END IF;
  END IF;
END
$$;

-- Ensure status column exists and has default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE "ImportSession" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'processing';
  ELSE
    -- Update any NULL values first
    UPDATE "ImportSession" SET "status" = 'processing' WHERE "status" IS NULL;
    -- Then make it NOT NULL if needed
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'status'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE "ImportSession" ALTER COLUMN "status" SET NOT NULL;
    END IF;
    -- Set default if it doesn't have one
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'status'
      AND column_default IS NOT NULL
    ) THEN
      ALTER TABLE "ImportSession" ALTER COLUMN "status" SET DEFAULT 'processing';
    END IF;
  END IF;
END
$$;

-- Ensure createdById column exists (or userId as an alias)
DO $$
BEGIN
  -- Check if createdById exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'createdById'
  ) THEN
    -- Check if userId exists instead
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'userId'
    ) THEN
      -- Rename userId to createdById for consistency
      ALTER TABLE "ImportSession" RENAME COLUMN "userId" TO "createdById";
    ELSE
      -- Add createdById if neither exists
      ALTER TABLE "ImportSession" ADD COLUMN "createdById" TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;
  
  -- Make sure createdById is NOT NULL
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'createdById'
    AND is_nullable = 'YES'
  ) THEN
    -- Update any NULL values first
    UPDATE "ImportSession" SET "createdById" = '' WHERE "createdById" IS NULL;
    -- Then make it NOT NULL
    ALTER TABLE "ImportSession" ALTER COLUMN "createdById" SET NOT NULL;
  END IF;
END
$$;

-- Ensure createdAt column exists and is NOT NULL with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ImportSession' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "ImportSession" ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ELSE
    -- Update any NULL values first
    UPDATE "ImportSession" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
    -- Then make it NOT NULL if needed
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'createdAt'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE "ImportSession" ALTER COLUMN "createdAt" SET NOT NULL;
    END IF;
    -- Set default if it doesn't have one
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ImportSession' 
      AND column_name = 'createdAt'
      AND column_default IS NOT NULL
    ) THEN
      ALTER TABLE "ImportSession" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
    END IF;
  END IF;
END
$$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_schema = ccu.constraint_schema 
    AND tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name = 'ImportSession'
    AND ccu.column_name = 'id'
    AND ccu.table_name = 'users'
  ) THEN
    -- Add foreign key constraint
    BEGIN
      ALTER TABLE "ImportSession" 
      ADD CONSTRAINT "ImportSession_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id");
    EXCEPTION
      WHEN others THEN
        -- Log error but continue - don't fail the migration
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
    END;
  END IF;
END
$$;

-- Add indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'ImportSession' 
    AND indexname = 'ImportSession_createdById_idx'
  ) THEN
    CREATE INDEX "ImportSession_createdById_idx" ON "ImportSession"("createdById");
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'ImportSession' 
    AND indexname = 'ImportSession_createdAt_idx'
  ) THEN
    CREATE INDEX "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
  END IF;
END
$$; 