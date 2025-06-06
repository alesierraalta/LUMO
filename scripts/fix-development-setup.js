#!/usr/bin/env node

/**
 * LUMO Development Setup Fix
 * Optimizes development environment and fixes common issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 LUMO Development Setup Fix');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function fixDevelopmentSetup() {
  try {
    console.log('\n1️⃣ Checking Prisma Schema Configuration...');
    
    // Check schema configuration
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Ensure proper SQLite configuration for development
    const hasProblematicFeatures = schema.includes('queryCompiler') || schema.includes('driverAdapters');
    
    if (hasProblematicFeatures) {
      console.log('⚠️ Found problematic preview features - fixing...');
      
      // Fix generator block
      schema = schema.replace(
        /generator client \{[\s\S]*?\}/,
        `generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native"]
}`
      );
      
      fs.writeFileSync(schemaPath, schema);
      console.log('✅ Schema configuration fixed');
    } else {
      console.log('✅ Schema configuration is correct');
    }
    
    console.log('\n2️⃣ Regenerating Prisma Client...');
    
    // Regenerate client with proper configuration
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated successfully');
    } catch (error) {
      console.error('❌ Error regenerating client:', error.message);
      return false;
    }
    
    console.log('\n3️⃣ Checking Database File...');
    
    // Ensure database file exists
    const dbPath = path.join(process.cwd(), 'dev.db');
    if (!fs.existsSync(dbPath)) {
      console.log('📄 Creating database file...');
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Database created and synced');
      } catch (error) {
        console.error('❌ Error creating database:', error.message);
        return false;
      }
    } else {
      console.log('✅ Database file exists');
    }
    
    console.log('\n4️⃣ Checking Environment Configuration...');
    
    // Check .env.local
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      
      if (envContent.includes('file:./dev.db')) {
        console.log('✅ Environment configured for SQLite development');
      } else {
        console.log('⚠️ Environment may be configured for production - this is normal if dual system is working');
      }
    } else {
      console.log('ℹ️ No .env.local file found');
    }
    
    console.log('\n5️⃣ Testing Basic Functionality...');
    
    // Test basic Prisma functionality
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Test connection
      await prisma.$connect();
      console.log('✅ Prisma client connection successful');
      
      // Test basic query
      const userCount = await prisma.user.count();
      console.log(`✅ Database query successful - ${userCount} users found`);
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Prisma client test failed:', error.message);
      return false;
    }
    
    console.log('\n🎉 Development setup fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   • Run: npm run dev');
    console.log('   • Access: http://localhost:3000');
    console.log('   • For production: npm run mode:prod');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing development setup:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fixDevelopmentSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixDevelopmentSetup }; 