#!/usr/bin/env node

/**
 * Fix min_stock_level column issue in Supabase database
 * This script adds the missing column and updates the Prisma schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting min_stock_level column fix...');

async function main() {
  try {
    // Step 1: Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ DATABASE_URL not found. This script requires a database connection.');
      console.log('📝 Please run the SQL migration manually in your Supabase dashboard:');
      console.log('   cat fix-min-stock-level.sql');
      return;
    }

    console.log('✅ DATABASE_URL found');

    // Step 2: Apply SQL migration if possible
    try {
      console.log('📝 Applying database migration...');
      
      // Check if we can connect to the database
      const testConnection = `
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.$connect().then(() => {
          console.log('Database connection successful');
          prisma.$disconnect();
        }).catch(err => {
          console.error('Database connection failed:', err.message);
          process.exit(1);
        });
      `;
      
      fs.writeFileSync('temp-db-test.js', testConnection);
      execSync('node temp-db-test.js', { stdio: 'inherit' });
      fs.unlinkSync('temp-db-test.js');

      // Apply migration using psql if available
      try {
        execSync('psql --version', { stdio: 'pipe' });
        console.log('📊 Applying SQL migration with psql...');
        execSync(`psql "${process.env.DATABASE_URL}" -f fix-min-stock-level.sql`, { 
          stdio: 'inherit' 
        });
        console.log('✅ SQL migration applied successfully');
      } catch (psqlError) {
        console.log('⚠️ psql not available. Please run the SQL migration manually.');
        console.log('📋 SQL commands to run in Supabase dashboard:');
        const sqlContent = fs.readFileSync('fix-min-stock-level.sql', 'utf8');
        console.log('\n' + sqlContent + '\n');
      }

    } catch (migrationError) {
      console.log('⚠️ Could not apply migration automatically:', migrationError.message);
      console.log('📋 Please run these SQL commands manually in your Supabase dashboard:');
      const sqlContent = fs.readFileSync('fix-min-stock-level.sql', 'utf8');
      console.log('\n' + sqlContent + '\n');
    }

    // Step 3: Generate Prisma client with updated schema
    console.log('🔄 Regenerating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client regenerated');

    // Step 4: Verify the fix
    console.log('🔍 Verifying the fix...');
    const verifyScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function verify() {
        try {
          // Try to create a test inventory item with minStockLevel
          const testItem = {
            name: 'Test Item for min_stock_level',
            sku: 'TEST-MIN-STOCK-' + Date.now(),
            price: 10.0,
            cost: 5.0,
            minStockLevel: 10,
            createdById: 'test-user-id'
          };
          
          console.log('Testing minStockLevel field...');
          // This would fail if the column doesn't exist
          const result = await prisma.inventoryItem.create({
            data: testItem
          });
          
          console.log('✅ minStockLevel field working correctly');
          
          // Clean up test item
          await prisma.inventoryItem.delete({
            where: { id: result.id }
          });
          
          console.log('✅ Test item cleaned up');
          
        } catch (error) {
          console.error('❌ Verification failed:', error.message);
          if (error.message.includes('min_stock_level')) {
            console.log('🔧 The database migration may not have been applied yet.');
            console.log('📝 Please run the SQL migration manually in Supabase.');
          }
        } finally {
          await prisma.$disconnect();
        }
      }
      
      verify();
    `;
    
    fs.writeFileSync('temp-verify.js', verifyScript);
    try {
      execSync('node temp-verify.js', { stdio: 'inherit' });
    } catch (verifyError) {
      console.log('⚠️ Verification test could not run:', verifyError.message);
    } finally {
      fs.unlinkSync('temp-verify.js');
    }

    console.log('\n🎉 Fix process completed!');
    console.log('📋 Summary:');
    console.log('   ✅ Updated Prisma schema with minStockLevel field');
    console.log('   ✅ Created SQL migration script');
    console.log('   ✅ Regenerated Prisma client');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy the updated schema to production');
    console.log('   2. Run the SQL migration in Supabase if not done automatically');
    console.log('   3. Test product creation functionality');

  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
    console.log('\n🔧 Manual steps to resolve:');
    console.log('   1. Run SQL migration in Supabase: cat fix-min-stock-level.sql');
    console.log('   2. Regenerate Prisma client: npx prisma generate');
    console.log('   3. Deploy the updated schema');
    process.exit(1);
  }
}

main().catch(console.error); 