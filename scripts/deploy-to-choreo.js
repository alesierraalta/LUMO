#!/usr/bin/env node

/**
 * Deploy to Choreo with Hybrid SQLite/Supabase Setup
 * This script helps prepare the application for Choreo deployment
 */

console.log('🚀 Preparando despliegue a Choreo...\n');

const instructions = `
🔧 CONFIGURACIÓN HÍBRIDA LISTA

📦 **Tu aplicación está configurada para:**
   - ✅ SQLite en desarrollo local
   - ✅ Supabase en producción (Choreo)

📋 **Pasos para desplegar en Choreo:**

1️⃣ **Configura las variables de entorno en Choreo:**
   
   SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
   
   NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
   
   CHOREO_DEPLOYMENT=true
   NODE_ENV=production
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui

2️⃣ **Ejecuta el SQL en Supabase:**
   - Ve a tu proyecto Supabase
   - Ve a SQL Editor
   - Copia y ejecuta el contenido de: supabase-migration.sql

3️⃣ **Deploy en Choreo:**
   - Haz push de tu código a GitHub
   - Deploy desde Choreo
   - La aplicación detectará automáticamente Supabase

4️⃣ **Crear usuario admin:**
   - El script se ejecutará automáticamente
   - Email: alesierraalta@gmail.com
   - Password: admin123

🔍 **Verificación local:**
   - npm run dev (usará SQLite)
   - Funciona normal con tu base de datos actual

🌟 **En producción:**
   - Detecta automáticamente Supabase
   - Usa las tablas creadas con el SQL

✅ **Todo listo! Tu app funciona híbrida:**
   - Local: SQLite + Prisma
   - Choreo: Supabase

📁 **Archivos importantes:**
   - src/lib/db-hybrid.ts (cliente híbrido)
   - supabase-migration.sql (schema para Supabase)
   - choreo-env-config.md (variables de entorno)
`;

console.log(instructions);

// Check if we're in the right environment
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verificando archivos...');

const requiredFiles = [
  'src/lib/db-hybrid.ts',
  'supabase-migration.sql',
  'choreo-env-config.md'
];

let allFilesPresent = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - FALTA`);
    allFilesPresent = false;
  }
});

if (allFilesPresent) {
  console.log('\n🎉 Todos los archivos están listos para el despliegue!');
} else {
  console.log('\n⚠️ Faltan algunos archivos. Ejecuta la configuración completa primero.');
}

console.log('\n📚 Para más ayuda, revisa: choreo-env-config.md\n'); 