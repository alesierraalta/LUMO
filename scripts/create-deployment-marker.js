#!/usr/bin/env node

/**
 * CREATE DEPLOYMENT MARKER - LUMO Inventory System
 * 
 * Genera marcadores únicos para forzar nuevos deployments en Choreo
 */

const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString();
const uniqueId = Math.random().toString(36).substring(2, 15);
const deploymentMarker = `DEPLOY_${timestamp.replace(/[:.]/g, '')}_${uniqueId}`;

console.log('🚀 CREATING DEPLOYMENT MARKER');
console.log('=============================');
console.log(`📝 Marker: ${deploymentMarker}`);

// Crear archivo marcador
const markerContent = `// LUMO Deployment Marker
// This file forces Choreo to create a fresh build
// Generated: ${timestamp}
// ID: ${deploymentMarker}

export const DEPLOYMENT_MARKER = {
  id: "${deploymentMarker}",
  timestamp: "${timestamp}",
  build: "FORCE_FRESH_BUILD",
  schema: "POSTGRESQL_ONLY"
};

console.log("🔄 FORCED FRESH BUILD:", "${deploymentMarker}");
`;

// Escribir marcador
fs.writeFileSync('deployment-marker.js', markerContent);
console.log('✅ Created: deployment-marker.js');

// Actualizar package.json con el marker
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Agregar marker como dependency comentario
packageJson._deploymentMarker = deploymentMarker;
packageJson._buildTimestamp = timestamp;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated: package.json with deployment marker');

// Crear verificador que use el marker
const verifierContent = `#!/usr/bin/env node

// LUMO Deployment Verification - ${deploymentMarker}
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
  const provider = content.match(/provider\\s*=\\s*"(\\w+)"/);
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
`;

fs.writeFileSync('verify-deployment.js', verifierContent);
console.log('✅ Created: verify-deployment.js');

console.log('\n📝 Next steps:');
console.log('1. Commit these files');
console.log('2. Push to trigger new Choreo build');
console.log('3. Monitor logs for the marker ID');
console.log('\n🎯 This will force Choreo to create a completely fresh build!'); 