#!/usr/bin/env node

// LUMO Deployment Verification - DEPLOY_2025-05-31T195816070Z_orc5b8k5a6c
const { DEPLOYMENT_MARKER } = require('./deployment-marker.js');

console.log('🔍 DEPLOYMENT VERIFICATION');
console.log('==========================');
console.log('Marker:', DEPLOYMENT_MARKER.id);
console.log('Build:', DEPLOYMENT_MARKER.build);
console.log('Schema:', DEPLOYMENT_MARKER.schema);

// Force schema verification
const fs = require('fs');

console.log('📋 Schema Verification:');
const schemaPath = 'prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const provider = content.match(/provider\s*=\s*"(\w+)"/);
  if (provider) {
    const p = provider[1];
    if (p === 'postgresql') {
      console.log('✅ Schema: PostgreSQL (CORRECT)');
    } else {
      console.log('❌ Schema:', p, '(WRONG - SHOULD BE POSTGRESQL)');
      process.exit(1);
    }
  }
}

console.log('🎉 Verification passed for build:', DEPLOYMENT_MARKER.id);
