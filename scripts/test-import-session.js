#!/usr/bin/env node

/**
 * Test ImportSession Accessibility
 * 
 * Este script prueba si el modelo ImportSession es accesible
 * y si se pueden realizar operaciones básicas con él.
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

// Crear un ID único para esta prueba
const testId = uuidv4();
console.log(`🔍 Iniciando prueba de ImportSession con ID: ${testId}`);

console.log('🔍 Testing ImportSession model availability...');

async function main() {
  try {
    // Initialize Prisma client
    console.log('🔄 Initializing Prisma client...');
    const prisma = new PrismaClient();
    
    // Get all available models
    console.log('🔍 Checking available models in Prisma client...');
    const models = Object.keys(prisma);
    console.log('📊 Available models:', models);
    
    // Check if ImportSession model exists
    const hasImportSession = models.includes('importSession');
    console.log(`${hasImportSession ? '✅' : '❌'} ImportSession model ${hasImportSession ? 'found' : 'not found'} in Prisma client`);
    
    // Try to access the ImportSession model
    if (hasImportSession) {
      try {
        console.log('🔄 Trying to access ImportSession model...');
        const sessions = await prisma.importSession.findMany({ take: 1 });
        console.log(`✅ Successfully accessed ImportSession model: ${sessions.length} records found`);
      } catch (error) {
        console.error('❌ Error accessing ImportSession model:', error.message);
      }
    } else {
      console.log('⚠️ Cannot test ImportSession access because model does not exist');
    }
    
    // Test database connection
    console.log('🔄 Testing general database connection...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log(`✅ Database connection successful: ${users.length} users found`);
    
    await prisma.$disconnect();
    console.log('🔄 Prisma client disconnected');
    
    return hasImportSession;
  } catch (error) {
    console.error('❌ Error testing ImportSession model:', error.message);
    return false;
  }
}

// Ejecutar la función principal
main()
  .then(success => {
    console.log(`\n${success ? '✅ ImportSession model is available' : '❌ ImportSession model is NOT available'}`);
    console.log('Test completed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 