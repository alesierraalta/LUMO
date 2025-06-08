#!/usr/bin/env node

/**
 * TEST DRIVER ADAPTER FIX
 * 
 * This script tests that the Prisma client can be initialized
 * without the driver adapter error.
 */

console.log('🧪 Testing Driver Adapter Fix...');
console.log('================================');

async function testDriverAdapterFix() {
  try {
    console.log('1. Testing direct PrismaClient import...');
    const { PrismaClient } = require('@prisma/client');
    
    console.log('✅ PrismaClient imported successfully');
    
    console.log('2. Testing PrismaClient initialization...');
    const client = new PrismaClient();
    
    console.log('✅ PrismaClient initialized successfully');
    
    console.log('3. Testing monkey-patch import...');
    const { prisma } = require('../src/lib/prisma-monkey-patch.js');
    
    console.log('✅ Monkey-patch client imported successfully');
    
    console.log('4. Testing database connection...');
    
    // Try a simple query
    await client.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Database connection successful');
    
    await client.$disconnect();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Driver adapter fix is working correctly');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
    
    if (error.message.includes('driver adapter')) {
      console.error('💡 This is still the driver adapter issue');
      console.error('   Make sure driverAdapters is removed from schema.prisma');
      console.error('   Run: npx prisma generate');
    }
    
    process.exit(1);
  }
}

testDriverAdapterFix(); 