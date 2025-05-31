#!/usr/bin/env node

/**
 * DEBUG DEPLOYMENT - LUMO Inventory System
 * 
 * Script de debug exhaustivo para encontrar por qué sigue apareciendo SQLite en producción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 LUMO DEPLOYMENT DEBUG - COMPREHENSIVE ANALYSIS');
console.log('=================================================\n');

// Función helper para buscar archivos
function findFiles(directory, pattern) {
  try {
    const command = process.platform === 'win32' 
      ? `Get-ChildItem -Path "${directory}" -Recurse -Include "*${pattern}*" -Force | Select-Object FullName`
      : `find "${directory}" -name "*${pattern}*" 2>/dev/null`;
    
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

// 1. BUSCAR TODOS LOS ARCHIVOS SCHEMA.PRISMA
function findAllSchemas() {
  console.log('1. 🔍 SEARCHING FOR ALL SCHEMA FILES...');
  console.log('=======================================');
  
  const searchPaths = [
    '.',
    '.next',
    'node_modules',
    'prisma'
  ];
  
  const allSchemas = [];
  
  searchPaths.forEach(searchPath => {
    if (fs.existsSync(searchPath)) {
      console.log(`\nSearching in: ${searchPath}`);
      const schemas = findFiles(searchPath, 'schema.prisma');
      schemas.forEach(schema => {
        console.log(`  📄 Found: ${schema}`);
        allSchemas.push(schema);
      });
    }
  });
  
  console.log(`\n📊 Total schemas found: ${allSchemas.length}`);
  return allSchemas;
}

// 2. ANALIZAR CADA SCHEMA ENCONTRADO
function analyzeSchemas(schemas) {
  console.log('\n2. 📋 ANALYZING ALL SCHEMAS...');
  console.log('==============================');
  
  schemas.forEach((schemaPath, index) => {
    console.log(`\n--- Schema ${index + 1}: ${schemaPath} ---`);
    
    try {
      if (fs.existsSync(schemaPath)) {
        const content = fs.readFileSync(schemaPath, 'utf8');
        const providerMatch = content.match(/provider\s*=\s*"(sqlite|postgresql)"/);
        const urlMatch = content.match(/url\s*=\s*env\("([^"]+)"\)/);
        
        if (providerMatch) {
          const provider = providerMatch[1];
          const emoji = provider === 'postgresql' ? '✅' : '❌';
          console.log(`  ${emoji} Provider: ${provider}`);
        } else {
          console.log('  ⚠️ No provider found');
        }
        
        if (urlMatch) {
          console.log(`  🔗 URL env var: ${urlMatch[1]}`);
        }
        
        // Mostrar las primeras líneas del datasource
        const datasourceMatch = content.match(/datasource db \{[^}]+\}/s);
        if (datasourceMatch) {
          console.log('  📝 Datasource block:');
          datasourceMatch[0].split('\n').forEach(line => {
            console.log(`    ${line.trim()}`);
          });
        }
      } else {
        console.log('  ❌ File does not exist');
      }
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error.message}`);
    }
  });
}

// 3. VERIFICAR ESTRUCTURA DE STANDALONE BUILD
function analyzeStandaloneBuild() {
  console.log('\n3. 🏗️ ANALYZING STANDALONE BUILD STRUCTURE...');
  console.log('==============================================');
  
  const standalonePath = '.next/standalone';
  
  if (!fs.existsSync(standalonePath)) {
    console.log('❌ Standalone build not found');
    return;
  }
  
  // Verificar server.js
  const serverJs = path.join(standalonePath, 'server.js');
  if (fs.existsSync(serverJs)) {
    console.log('✅ server.js exists');
    
    // Buscar referencias a Prisma en server.js
    try {
      const serverContent = fs.readFileSync(serverJs, 'utf8');
      const prismaRefs = serverContent.match(/prisma|\.prisma/gi) || [];
      console.log(`  📊 Prisma references in server.js: ${prismaRefs.length}`);
    } catch (error) {
      console.log(`  ⚠️ Could not read server.js: ${error.message}`);
    }
  }
  
  // Verificar node_modules/.prisma
  const prismaClientPath = path.join(standalonePath, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ .prisma/client exists in standalone');
    
    // Listar archivos en .prisma/client
    try {
      const files = fs.readdirSync(prismaClientPath);
      console.log('  📁 Files in .prisma/client:');
      files.forEach(file => {
        console.log(`    - ${file}`);
      });
    } catch (error) {
      console.log(`  ⚠️ Could not list .prisma/client files: ${error.message}`);
    }
  } else {
    console.log('❌ .prisma/client missing in standalone');
  }
  
  // Buscar CUALQUIER archivo que contenga "sqlite"
  console.log('\n  🔍 Searching for ANY files containing "sqlite" in standalone...');
  try {
    const grepCommand = process.platform === 'win32'
      ? `Get-ChildItem -Path "${standalonePath}" -Recurse -File | Select-String -Pattern "sqlite" -List | Select-Object Filename`
      : `grep -r "sqlite" "${standalonePath}" 2>/dev/null || echo "No sqlite references found"`;
    
    const result = execSync(grepCommand, { encoding: 'utf8', stdio: 'pipe' });
    if (result.trim()) {
      console.log('  ⚠️ Files containing "sqlite":');
      console.log(result);
    } else {
      console.log('  ✅ No sqlite references found');
    }
  } catch (error) {
    console.log('  ℹ️ Could not search for sqlite references');
  }
}

// 4. VERIFICAR VARIABLES DE ENTORNO
function analyzeEnvironment() {
  console.log('\n4. 🌍 ANALYZING ENVIRONMENT...');
  console.log('==============================');
  
  const envVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'CHOREO_DEPLOYMENT',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      if (varName === 'DATABASE_URL') {
        const type = value.startsWith('postgresql://') ? 'PostgreSQL' : 
                    value.startsWith('file:') ? 'SQLite' : 'Unknown';
        console.log(`  ✅ ${varName}: ${type} (${value.substring(0, 30)}...)`);
      } else {
        console.log(`  ✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
}

// 5. VERIFICAR PROCESO DE BUILD
function analyzeBuildProcess() {
  console.log('\n5. 🛠️ ANALYZING BUILD PROCESS...');
  console.log('=================================');
  
  // Verificar scripts en package.json
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📝 Relevant npm scripts:');
    const relevantScripts = [
      'prebuild',
      'build',
      'postbuild',
      'start',
      'schema:postgresql',
      'schema:select'
    ];
    
    relevantScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        console.log(`  ${script}: ${packageJson.scripts[script]}`);
      }
    });
  }
  
  // Verificar choreo.yaml
  const choreoYamlPath = 'choreo.yaml';
  if (fs.existsSync(choreoYamlPath)) {
    console.log('\n📝 Choreo.yaml build commands:');
    const choreoContent = fs.readFileSync(choreoYamlPath, 'utf8');
    
    // Extraer comandos de build
    const buildMatch = choreoContent.match(/build:\s*command:\s*\|\s*([\s\S]*?)(?=\s*env:|$)/);
    if (buildMatch) {
      const buildCommands = buildMatch[1].split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'))
        .map(line => line.trim());
      
      buildCommands.forEach((cmd, index) => {
        console.log(`    ${index + 1}. ${cmd}`);
      });
    }
  }
}

// 6. GENERAR SCRIPT DE VERIFICACIÓN EN RUNTIME
function generateRuntimeCheck() {
  console.log('\n6. 🔧 GENERATING RUNTIME VERIFICATION SCRIPT...');
  console.log('===============================================');
  
  const runtimeScript = `
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
  console.log(\`\\nChecking: \${schemaPath}\`);
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const providerMatch = content.match(/provider\\s*=\\s*"(sqlite|postgresql)"/);
    if (providerMatch) {
      console.log(\`  Provider: \${providerMatch[1]}\`);
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
  console.log('\\nPrisma Client import: SUCCESS');
  
  // Try to read the actual schema being used
  const prismaClient = new PrismaClient();
  console.log('Prisma Client instantiation: SUCCESS');
} catch (error) {
  console.log('\\nPrisma Client error:', error.message);
}
`;
  
  fs.writeFileSync('runtime-schema-check.js', runtimeScript);
  console.log('✅ Created runtime-schema-check.js');
  console.log('📝 Add this to your deployment to run at startup:');
  console.log('   node runtime-schema-check.js');
}

// 7. SUGERENCIAS DE DEBUG
function generateDebugSuggestions() {
  console.log('\n7. 💡 DEBUG SUGGESTIONS...');
  console.log('===========================');
  
  console.log('🔧 Immediate actions to try:');
  console.log('1. Add runtime verification to choreo.yaml before starting server');
  console.log('2. Force clean build by deleting all cache');
  console.log('3. Check if Choreo is using cached artifacts');
  console.log('4. Verify the exact build sequence in Choreo logs');
  
  console.log('\n🚨 Potential issues:');
  console.log('• Choreo might be caching old build artifacts');
  console.log('• Multiple Prisma clients might be present');
  console.log('• Build order might be wrong in production');
  console.log('• Environment variables might not be set during build');
  
  console.log('\n📋 Next steps:');
  console.log('1. Update choreo.yaml to include runtime verification');
  console.log('2. Force rebuild with cache clearing');
  console.log('3. Monitor exact build logs in Choreo');
}

// EJECUTAR TODOS LOS ANÁLISIS
async function runFullDebug() {
  const schemas = findAllSchemas();
  analyzeSchemas(schemas);
  analyzeStandaloneBuild();
  analyzeEnvironment();
  analyzeBuildProcess();
  generateRuntimeCheck();
  generateDebugSuggestions();
  
  console.log('\n🎯 DEBUG ANALYSIS COMPLETE');
  console.log('===========================');
  console.log('Check the output above for any anomalies.');
  console.log('Runtime verification script created: runtime-schema-check.js');
}

runFullDebug(); 