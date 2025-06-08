#!/usr/bin/env node

/**
 * EMERGENCY SCHEMA RUNTIME FIX
 * 
 * This script detects Prisma client/schema mismatches at runtime and 
 * rebuilds the client configuration to match the actual DATABASE_URL.
 * 
 * Specifically fixes P6001 errors where client expects prisma:// but 
 * DATABASE_URL is direct PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 EMERGENCY SCHEMA RUNTIME FIX');
console.log('===============================');

function detectProtocolMismatch() {
  const databaseUrl = process.env.DATABASE_URL || '';
  
  console.log(`📊 Analyzing environment:`)
  console.log(`   DATABASE_URL: ${databaseUrl.slice(0, 25)}...`);
  
  const isDirect = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  const isAccelerate = databaseUrl.startsWith('prisma://');
  
  console.log(`   Direct PostgreSQL: ${isDirect ? '✅' : '❌'}`);
  console.log(`   Prisma Accelerate: ${isAccelerate ? '✅' : '❌'}`);
  
  return { isDirect, isAccelerate, databaseUrl };
}

function createDirectPostgreSQLSchema() {
  console.log('🔧 Creating direct PostgreSQL schema...');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup-runtime');
  
  // Backup current schema
  if (fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, backupPath);
    console.log('📋 Backed up current schema');
  }
  
  // Create direct PostgreSQL schema
  const directSchema = `// Generator configuration for direct PostgreSQL
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler"]
  binaryTargets   = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
}

// Direct PostgreSQL datasource
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("USER")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  inventoryItems    InventoryItem[]
  stockMovements    StockMovement[]
  sales            Sale[]
  createdCategories Category[]
  importSessions   ImportSession[]

  @@index([email])
  @@index([role])
}

// Category model
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])

  // Relations
  inventoryItems InventoryItem[]

  @@index([name])
  @@index([createdById])
}

// Location model
model Location {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  inventoryItems InventoryItem[]
  stockMovements StockMovement[]

  @@index([name])
  @@index([isActive])
}

// InventoryItem model
model InventoryItem {
  id             String   @id @default(uuid())
  name           String
  description    String?
  sku            String?  @unique
  barcode        String?
  currentStock   Int      @default(0)
  minLevel       Int      @default(0)
  maxLevel       Int?
  cost           Float    @default(0)
  price          Float    @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  categoryId     String?
  locationId     String?
  createdById    String
  
  // Relations
  category       Category?       @relation(fields: [categoryId], references: [id])
  location       Location?       @relation(fields: [locationId], references: [id])
  createdBy      User           @relation(fields: [createdById], references: [id])
  stockMovements StockMovement[]
  salesItems     SaleItem[]

  @@index([sku])
  @@index([name])
  @@index([categoryId])
  @@index([locationId])
  @@index([createdById])
  @@index([isActive])
}

// StockMovement model
model StockMovement {
  id              String        @id @default(uuid())
  type            String        // IN, OUT, ADJUSTMENT
  quantity        Int
  previousStock   Int
  newStock        Int
  cost            Float?
  price           Float?
  reason          String?
  notes           String?
  createdAt       DateTime      @default(now())
  inventoryItemId String
  locationId      String?
  createdById     String
  
  // Relations
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  location        Location?     @relation(fields: [locationId], references: [id])
  createdBy       User          @relation(fields: [createdById], references: [id])

  @@index([inventoryItemId])
  @@index([type])
  @@index([createdAt])
  @@index([createdById])
}

// Sale model
model Sale {
  id          String     @id @default(uuid())
  total       Float
  tax         Float      @default(0)
  discount    Float      @default(0)
  status      String     @default("COMPLETED") // COMPLETED, REFUNDED, CANCELLED
  notes       String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  createdById String
  
  // Relations
  createdBy   User       @relation(fields: [createdById], references: [id])
  items       SaleItem[]

  @@index([createdAt])
  @@index([status])
  @@index([createdById])
}

// SaleItem model
model SaleItem {
  id              String        @id @default(uuid())
  quantity        Int
  price           Float
  total           Float
  saleId          String
  inventoryItemId String
  
  // Relations
  sale            Sale          @relation(fields: [saleId], references: [id], onDelete: Cascade)
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])

  @@index([saleId])
  @@index([inventoryItemId])
}

// ImportSession model
model ImportSession {
  id            String               @id @default(uuid())
  filePath      String               // Primary file path field - the only one that should be used
  status        String               @default("processing") // processing, completed, failed
  notes         String?
  totalItems    Int                  @default(0)
  successItems  Int                  @default(0)
  warningItems  Int                  @default(0)
  errorItems    Int                  @default(0)
  createdById   String
  createdBy     User                 @relation(fields: [createdById], references: [id])
  createdAt     DateTime             @default(now())
  completedAt   DateTime?
  details       ImportSessionDetail[]

  @@index([createdById])
  @@index([createdAt])
}

// ImportSessionDetail model
model ImportSessionDetail {
  id              String        @id @default(uuid())
  rowIndex        Int
  status          String        // success, warning, error
  message         String?
  data            String?       // JSON data of the row
  importSessionId String
  createdAt       DateTime      @default(now())
  
  // Relations
  importSession   ImportSession @relation(fields: [importSessionId], references: [id], onDelete: Cascade)

  @@index([importSessionId])
  @@index([status])
}
`;

  fs.writeFileSync(schemaPath, directSchema);
  console.log('✅ Created direct PostgreSQL schema');
  
  return schemaPath;
}

function regenerateClient() {
  console.log('🔄 Regenerating Prisma client...');
  
  try {
    // Clear cache
    const cacheDir = path.join(process.cwd(), 'node_modules', '.prisma');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('🗑️ Cleared Prisma cache');
    }
    
    // Regenerate
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Client regeneration completed');
    
    return true;
  } catch (error) {
    console.error('❌ Client regeneration failed:', error.message);
    return false;
  }
}

function emergencyFix() {
  console.log('\n🚨 Starting emergency runtime fix...');
  
  const { isDirect, isAccelerate } = detectProtocolMismatch();
  
  if (isDirect) {
    console.log('🔧 Direct PostgreSQL detected - creating compatible schema...');
    
    // Create direct schema
    createDirectPostgreSQLSchema();
    
    // Regenerate client
    const success = regenerateClient();
    
    if (success) {
      console.log('✅ Emergency fix completed successfully');
      console.log('📝 Prisma client now configured for direct PostgreSQL');
      return true;
    } else {
      console.error('❌ Emergency fix failed during client regeneration');
      return false;
    }
  } else if (isAccelerate) {
    console.log('ℹ️ Prisma Accelerate URL detected - no schema changes needed');
    return true;
  } else {
    console.warn('⚠️ Unrecognized DATABASE_URL format');
    return false;
  }
}

function main() {
  console.log('🎯 Emergency Schema Runtime Fix - Execution Started');
  
  const success = emergencyFix();
  
  if (success) {
    console.log('\n✅ EMERGENCY FIX COMPLETED SUCCESSFULLY');
    console.log('🚀 Application should now be able to connect to database');
  } else {
    console.log('\n❌ EMERGENCY FIX FAILED');
    console.log('📝 Manual intervention may be required');
  }
  
  return success;
}

module.exports = { main, emergencyFix, createDirectPostgreSQLSchema, regenerateClient };

if (require.main === module) {
  main();
} 