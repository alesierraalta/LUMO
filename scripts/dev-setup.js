#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️  LUMO Development Environment Setup');
console.log('====================================');

// Función para ejecutar comandos con manejo de errores
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Función para crear archivo .env.local si no existe
function setupEnvFile() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envTemplatePath = path.join(process.cwd(), 'env.template');
  
  console.log('\n📁 Setting up environment file...');
  
  if (fs.existsSync(envLocalPath)) {
    console.log('ℹ️  .env.local already exists, skipping creation');
    return true;
  }
  
  if (!fs.existsSync(envTemplatePath)) {
    console.error('❌ env.template not found');
    return false;
  }
  
  try {
    const templateContent = fs.readFileSync(envTemplatePath, 'utf8');
    fs.writeFileSync(envLocalPath, templateContent);
    console.log('✅ Created .env.local from template');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error.message);
    return false;
  }
}

// Función para limpiar base de datos anterior
function cleanPreviousDatabase() {
  console.log('\n🧹 Cleaning previous development database...');
  
  const devDbPath = path.join(process.cwd(), 'dev.db');
  
  if (fs.existsSync(devDbPath)) {
    try {
      fs.unlinkSync(devDbPath);
      console.log('✅ Previous SQLite database removed');
    } catch (error) {
      console.log('⚠️  Could not remove previous database:', error.message);
    }
  } else {
    console.log('ℹ️  No previous database found');
  }
  
  return true;
}

// Función principal
async function main() {
  let allSuccess = true;
  
  // 1. Configurar archivo .env.local
  if (!setupEnvFile()) {
    allSuccess = false;
  }
  
  // 2. Activar modo desarrollo con SQLite
  console.log('\n🔄 Activating development mode with SQLite...');
  try {
    execSync('node scripts/switch-mode.js dev', { stdio: 'inherit' });
    console.log('✅ Development mode activated');
  } catch (error) {
    console.log('⚠️  Could not activate development mode automatically');
  }
  
  // 3. Limpiar base de datos anterior
  if (!cleanPreviousDatabase()) {
    allSuccess = false;
  }
  
  // 4. Instalar dependencias
  if (!runCommand('npm install', 'Installing dependencies')) {
    allSuccess = false;
  }
  
  // 5. Generar Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    allSuccess = false;
  }
  
  // 6. Ejecutar migraciones para SQLite
  console.log('\n🔄 Setting up SQLite database...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ SQLite database setup completed');
  } catch (error) {
    console.log('⚠️  Database setup failed - continuing anyway');
  }
  
  // 7. Seed datos de desarrollo
  console.log('\n🌱 Seeding development data...');
  try {
    execSync('node prisma/seed-dev.js', { stdio: 'inherit' });
    console.log('✅ Development data seeded');
  } catch (error) {
    console.log('⚠️  Seeding failed - you can run npm run dev:seed manually');
  }
  
  console.log('\n🎉 Development setup summary:');
  console.log('================================');
  console.log('✅ Environment file: .env.local');
  console.log('✅ Database: SQLite (dev.db)');
  console.log('✅ Dependencies: installed');
  console.log('✅ Prisma client: generated');
  
  if (allSuccess) {
    console.log('\n🚀 Ready for development!');
    console.log('Run: npm run dev');
  } else {
    console.log('\n⚠️  Setup completed with some warnings');
    console.log('Try running: npm run dev:fresh');
  }
  
  console.log('\n📖 Development URLs:');
  console.log('   - App: http://localhost:3000');
  console.log('   - Health: http://localhost:3000/api/health');
  console.log('   - Database: SQLite file (./dev.db)');
  
  console.log('\n👥 Test Users:');
  console.log('   - admin@lumo.dev / admin123 (Admin)');
  console.log('   - manager@lumo.dev / manager123 (Manager)');
  console.log('   - user@lumo.dev / user123 (User)');
  
  console.log('\n🔧 Useful Commands:');
  console.log('   - npm run mode:dev    # Switch to development mode');
  console.log('   - npm run mode:prod   # Switch to production mode');
  console.log('   - npm run dev:reset   # Reset development database');
  console.log('   - npm run db:studio   # Open database editor');
}

main().catch(console.error); 