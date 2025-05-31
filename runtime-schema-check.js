
// Runtime schema verification script
const fs = require('fs');
const path = require('path');

console.log('=== RUNTIME SCHEMA VERIFICATION ===');
console.log('Current working directory:', process.cwd());
console.log('Environment variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Check all possible schema locations
const possibleSchemas = [
  'prisma/schema.prisma',
  'node_modules/.prisma/client/schema.prisma',
  '.next/standalone/node_modules/.prisma/client/schema.prisma'
];

possibleSchemas.forEach(schemaPath => {
  console.log(`\nChecking: ${schemaPath}`);
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const providerMatch = content.match(/provider\s*=\s*"(sqlite|postgresql)"/);
    if (providerMatch) {
      console.log(`  Provider: ${providerMatch[1]}`);
    } else {
      console.log('  No provider found');
    }
  } else {
    console.log('  File does not exist');
  }
});

// Try to import and check Prisma client
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('\nPrisma Client import: SUCCESS');
  
  // Try to read the actual schema being used
  const prismaClient = new PrismaClient();
  console.log('Prisma Client instantiation: SUCCESS');
} catch (error) {
  console.log('\nPrisma Client error:', error.message);
}
