#!/usr/bin/env node

/**
 * Final Deployment Check for LUMO Inventory System
 * 
 * Verifica que todo esté configurado correctamente para el deployment en Choreo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LUMO Final Deployment Check');
console.log('==============================\n');

let allChecks = true;

// 1. Verificar schema principal
function checkMainSchema() {
  console.log('1. 📋 Checking main schema...');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('   ❌ schema.prisma not found');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const providerMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (!providerMatch) {
    console.log('   ❌ No provider found in schema');
    return false;
  }
  
  const provider = providerMatch[1];
  if (provider === 'postgresql') {
    console.log('   ✅ Main schema: PostgreSQL');
    return true;
  } else {
    console.log(`   ❌ Main schema: ${provider} (should be postgresql)`);
    return false;
  }
}

// 2. Verificar Prisma Client embebido
function checkEmbeddedSchema() {
  console.log('2. 🔧 Checking embedded Prisma Client schema...');
  const embeddedSchemaPath = path.join(process.cwd(), '.next', 'standalone', 'node_modules', '.prisma', 'client', 'schema.prisma');
  
  if (!fs.existsSync(embeddedSchemaPath)) {
    console.log('   ❌ Embedded schema not found (build may be incomplete)');
    return false;
  }
  
  const schemaContent = fs.readFileSync(embeddedSchemaPath, 'utf8');
  const providerMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (!providerMatch) {
    console.log('   ❌ No provider found in embedded schema');
    return false;
  }
  
  const provider = providerMatch[1];
  if (provider === 'postgresql') {
    console.log('   ✅ Embedded schema: PostgreSQL');
    return true;
  } else {
    console.log(`   ❌ Embedded schema: ${provider} (should be postgresql)`);
    return false;
  }
}

// 3. Verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('3. 🌍 Checking environment variables...');
  
  const requiredVars = ['DATABASE_URL'];
  const optionalVars = ['JWT_SECRET']; // Opcional en desarrollo, requerido en producción
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      if (varName === 'DATABASE_URL') {
        const dbUrl = process.env[varName];
        if (dbUrl.startsWith('postgresql://')) {
          console.log(`   ✅ ${varName}: PostgreSQL URL`);
        } else {
          console.log(`   ❌ ${varName}: Not a PostgreSQL URL`);
          allVarsPresent = false;
        }
      } else {
        console.log(`   ✅ ${varName}: Set`);
      }
    } else {
      console.log(`   ❌ ${varName}: Not set`);
      allVarsPresent = false;
    }
  });
  
  // Verificar variables opcionales
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ⚠️  ${varName}: Not set (will be provided by Choreo)`);
    }
  });
  
  return allVarsPresent;
}

// 4. Verificar archivos de build
function checkBuildFiles() {
  console.log('4. 🏗️ Checking build files...');
  
  const requiredFiles = [
    '.next/standalone/server.js',
    '.next/standalone/package.json',
    '.next/standalone/node_modules/.prisma/client',
    '.next/standalone/.next/server'
  ];
  
  let allFilesPresent = true;
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${filePath}`);
    } else {
      console.log(`   ❌ ${filePath} missing`);
      allFilesPresent = false;
    }
  });
  
  return allFilesPresent;
}

// 5. Verificar configuración de Choreo
function checkChoreoConfig() {
  console.log('5. 🚀 Checking Choreo configuration...');
  
  const choreoPath = path.join(process.cwd(), 'choreo.yaml');
  if (!fs.existsSync(choreoPath)) {
    console.log('   ❌ choreo.yaml not found');
    return false;
  }
  
  const choreoContent = fs.readFileSync(choreoPath, 'utf8');
  
  // Verificar comandos críticos
  const hasSchemaPostgresql = choreoContent.includes('npm run schema:postgresql');
  const hasPrismaGenerate = choreoContent.includes('npx prisma generate');
  const hasCorrectStart = choreoContent.includes('node .next/standalone/server.js');
  
  if (hasSchemaPostgresql) {
    console.log('   ✅ PostgreSQL schema selection');
  } else {
    console.log('   ❌ Missing PostgreSQL schema selection');
    return false;
  }
  
  if (hasPrismaGenerate) {
    console.log('   ✅ Prisma generate command');
  } else {
    console.log('   ❌ Missing Prisma generate command');
    return false;
  }
  
  if (hasCorrectStart) {
    console.log('   ✅ Correct start command');
  } else {
    console.log('   ❌ Incorrect start command');
    return false;
  }
  
  return hasSchemaPostgresql && hasPrismaGenerate && hasCorrectStart;
}

// 6. Verificar binary targets
function checkBinaryTargets() {
  console.log('6. 🎯 Checking binary targets...');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const hasDebianTarget = schemaContent.includes('debian-openssl-3.0.x');
  const hasLinuxMusl = schemaContent.includes('linux-musl');
  
  if (hasDebianTarget && hasLinuxMusl) {
    console.log('   ✅ Linux binary targets present');
    return true;
  } else {
    console.log('   ❌ Missing Linux binary targets');
    return false;
  }
}

// Ejecutar todas las verificaciones
async function runAllChecks() {
  const checks = [
    checkMainSchema(),
    checkEmbeddedSchema(),
    checkEnvironmentVariables(),
    checkBuildFiles(),
    checkChoreoConfig(),
    checkBinaryTargets()
  ];
  
  allChecks = checks.every(check => check);
  
  console.log('\n📊 Final Results:');
  console.log('==================');
  
  if (allChecks) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ Ready for Choreo deployment');
    console.log('\n🚀 Next steps:');
    console.log('   1. Commit and push changes');
    console.log('   2. Deploy to Choreo');
    console.log('   3. Monitor deployment logs');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED!');
    console.log('⚠️  Please fix the issues above before deploying');
    process.exit(1);
  }
}

runAllChecks(); 