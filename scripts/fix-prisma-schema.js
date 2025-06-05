#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Prisma Schema Configuration Script
 * Automatically configures schema for development or production environments
 */

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Check command line arguments
const args = process.argv.slice(2);
const forcePostgres = args.includes('--force-postgresql');
const forceSqlite = args.includes('--force-sqlite');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.CHOREO_DEPLOYMENT === 'true' || 
                    forcePostgres;

const isDevelopment = !isProduction || forceSqlite;

console.log('🔧 Configuring Prisma schema...');
console.log(`📋 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📋 Database: ${isProduction ? 'PostgreSQL' : 'SQLite'}`);

// Read current schema
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema file not found:', schemaPath);
  process.exit(1);
}

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Define the correct generator configuration
const productionGenerator = `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
  binaryTargets   = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
}`;

const developmentGenerator = `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
  binaryTargets   = ["native"]
}`;

// Define the correct datasource configuration
const productionDatasource = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

const developmentDatasource = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

// Replace generator block
const generatorRegex = /generator client \{[\s\S]*?\}/;
const datasourceRegex = /datasource db \{[\s\S]*?\}/;

const newGenerator = isProduction ? productionGenerator : developmentGenerator;
const newDatasource = isProduction ? productionDatasource : developmentDatasource;

schemaContent = schemaContent.replace(generatorRegex, newGenerator);
schemaContent = schemaContent.replace(datasourceRegex, newDatasource);

// Ensure ImportSession model is properly defined
const importSessionModelRegex = /model ImportSession \{[\s\S]*?\}/;
const importSessionModel = `model ImportSession {
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
}`;

if (importSessionModelRegex.test(schemaContent)) {
  // Replace existing ImportSession model
  schemaContent = schemaContent.replace(importSessionModelRegex, importSessionModel);
  console.log('✅ Updated ImportSession model');
} else {
  // Add ImportSession model if it doesn't exist
  schemaContent += '\n\n' + importSessionModel;
  console.log('✅ Added ImportSession model');
}

// Write the updated schema
fs.writeFileSync(schemaPath, schemaContent);

console.log('✅ Prisma schema updated successfully');
console.log(`📄 Configuration: ${isProduction ? 'Production (PostgreSQL)' : 'Development (SQLite)'}`);
console.log('🔧 Features: queryCompiler, driverAdapters enabled');

// Validate schema
try {
  const { execSync } = require('child_process');
  console.log('🔍 Validating schema...');
  execSync('npx prisma validate', { stdio: 'pipe' });
  console.log('✅ Schema validation passed');
} catch (error) {
  console.error('❌ Schema validation failed:', error.message);
  process.exit(1);
}

console.log('🚀 Schema configuration complete!'); 