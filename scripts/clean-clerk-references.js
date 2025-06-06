#!/usr/bin/env node

/**
 * Clean Clerk References from LUMO Inventory System
 * Removes all Clerk authentication references for JWT-only authentication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 LUMO Clerk Cleanup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const filesToClean = [
  'scripts/runtime-env-check.js',
  'scripts/verify-environment-config.js',
  'scripts/runtime-env-fix.js',
  'scripts/embed-env-vars.js',
  'src/app/api/error-report/route.ts',
  'src/app/api/test-production/route.ts',
  'src/app/api/health-advanced/route.ts',
  'src/app/api/enable-dev-mode/route.ts',
  'src/app/api/env-config/route.ts',
  'src/app/api/choreo-health/route.ts',
  'src/app/api/auth/force-admin/route.ts',
  'src/lib/env-validation.ts',
  'src/components/auth/ErrorBoundary.tsx',
  'package.json'
];

function cleanFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Patterns to remove/replace
    const clerkPatterns = [
      // Environment variables
      /['"`]NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY['"`]/g,
      /['"`]CLERK_SECRET_KEY['"`]/g,
      /['"`]CLERK_JWT_VERIFICATION_KEY['"`]/g,
      /['"`]CLERK_PUBLISHABLE_KEY['"`]/g,
      /['"`]NEXT_PUBLIC_SKIP_CLERK_AUTH['"`]/g,
      
      // Configuration references
      /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/g,
      /CLERK_SECRET_KEY/g,
      /CLERK_JWT_VERIFICATION_KEY/g,
      /CLERK_PUBLISHABLE_KEY/g,
      /NEXT_PUBLIC_SKIP_CLERK_AUTH/g,
      
      // Function names
      /checkClerkHealth/g,
      /clerkMode/g,
      /clerkVars/g,
      /missingClerkVars/g,
      /clerkKey/g,
      /clerk_publishable/g,
      /clerk_secret/g,
      /has_clerk_public/g,
      /has_clerk_secret/g,
      
      // Comments and strings mentioning Clerk
      /\/\*[\s\S]*?clerk[\s\S]*?\*\//gi,
      /\/\/.*clerk.*/gi,
      /['"`][^'"`]*clerk[^'"`]*['"`]/gi,
      
      // Auth provider references
      /AUTH_PROVIDER.*=.*['"`]clerk['"`]/g,
      /NEXT_AUTH_PROVIDER.*=.*['"`]clerk['"`]/g,
    ];
    
    // Lines to remove completely
    const linesToRemove = [
      /.*CLERK.*=.*,?\s*$/gmi,
      /.*clerk.*:.*,?\s*$/gmi,
      /.*\.includes\(['"`]Clerk['"`]\).*$/gmi,
      /.*\.includes\(['"`]ClerkProvider['"`]\).*$/gmi,
      /.*Missing Clerk.*$/gmi,
      /.*configure proper Clerk keys.*$/gmi,
      /.*use Clerk real.*$/gmi,
      /.*placeholder Clerk.*$/gmi,
      /.*invalid.*Clerk.*$/gmi,
    ];
    
    // Apply pattern replacements
    clerkPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // Remove lines
    linesToRemove.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // Clean up empty lines and trailing commas
    content = content
      .replace(/,\s*,/g, ',')                    // Double commas
      .replace(/,\s*\}/g, '}')                   // Trailing commas in objects
      .replace(/,\s*\]/g, ']')                   // Trailing commas in arrays
      .replace(/\n\s*\n\s*\n/g, '\n\n')         // Multiple empty lines
      .replace(/\s+$/gm, '')                     // Trailing whitespace
      .trim();
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Limpiado: ${filePath}`);
    } else {
      console.log(`➖ Sin cambios: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error limpiando ${filePath}:`, error.message);
  }
}

function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('⚠️  package.json no encontrado');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    let modified = false;
    
    // Remove dev:clerk script
    if (packageJson.scripts && packageJson.scripts['dev:clerk']) {
      delete packageJson.scripts['dev:clerk'];
      modified = true;
      console.log('✅ Script dev:clerk eliminado');
    }
    
    // Add setup:neon script
    if (packageJson.scripts) {
      packageJson.scripts['setup:neon'] = 'node scripts/setup-neon-database.js';
      packageJson.scripts['clean:clerk'] = 'node scripts/clean-clerk-references.js';
      modified = true;
      console.log('✅ Scripts setup:neon y clean:clerk agregados');
    }
    
    if (modified) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error actualizando package.json:', error.message);
  }
}

function cleanEnvTemplate() {
  const envTemplatePath = path.join(process.cwd(), 'env.template');
  
  if (!fs.existsSync(envTemplatePath)) {
    console.log('⚠️  env.template no encontrado');
    return;
  }
  
  try {
    let content = fs.readFileSync(envTemplatePath, 'utf8');
    
    // Remove Clerk-related environment variable examples
    content = content
      .replace(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*$/gm, '')
      .replace(/^CLERK_SECRET_KEY=.*$/gm, '')
      .replace(/^NEXT_PUBLIC_SKIP_CLERK_AUTH=.*$/gm, '')
      .replace(/^# Clerk Authentication.*$/gm, '')
      .replace(/^# =+ CLERK.* =+.*$/gm, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    fs.writeFileSync(envTemplatePath, content);
    console.log('✅ env.template limpiado');
    
  } catch (error) {
    console.error('❌ Error limpiando env.template:', error.message);
  }
}

function createCleanEnvTemplate() {
  const envTemplatePath = path.join(process.cwd(), 'env.template');
  
  const cleanTemplate = `# =============================================================================
# LUMO INVENTORY SYSTEM - ENVIRONMENT TEMPLATE
# =============================================================================
# Copy this to .env.local for local development
# Copy this to .env for production

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
NODE_ENV=development
DEVELOPMENT_MODE=true
PORT=3000
HOSTNAME=localhost

# =============================================================================
# DATABASE (SQLite for development, PostgreSQL for production)
# =============================================================================
# Local development (SQLite)
DATABASE_URL=file:./dev.db

# Production (Neon PostgreSQL) - uncomment and configure for production
# DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
# DIRECT_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require

# =============================================================================
# JWT AUTHENTICATION (NO CLERK)
# =============================================================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# =============================================================================
# APPLICATION URLS
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=debug
ENABLE_DEBUG_LOGS=true
ENABLE_QUERY_LOGS=true

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true

# =============================================================================
# NOTES
# =============================================================================
# - Use SQLite for local development (DATABASE_URL=file:./dev.db)
# - Use Neon PostgreSQL for production 
# - Switch between modes: npm run mode:dev | npm run mode:prod
# - Setup Neon: DATABASE_URL="postgresql://..." npm run setup:neon
`;

  fs.writeFileSync(envTemplatePath, cleanTemplate);
  console.log('✅ env.template actualizado con configuración JWT sin Clerk');
}

function main() {
  console.log('🚀 Iniciando limpieza de referencias a Clerk...\n');
  
  // Clean individual files
  filesToClean.forEach(cleanFile);
  
  console.log('\n🔧 Actualizando archivos de configuración...');
  
  // Update package.json
  updatePackageJson();
  
  // Create clean env template
  createCleanEnvTemplate();
  
  console.log('\n🎉 Limpieza completada!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ TAREAS COMPLETADAS:');
  console.log('   • Referencias a Clerk eliminadas de archivos de código');
  console.log('   • Scripts package.json actualizados');
  console.log('   • env.template actualizado sin Clerk');
  console.log('   • Sistema configurado para JWT puro');
  console.log('');
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('   1. Configura tu base de datos Neon:');
  console.log('      DATABASE_URL="postgresql://..." npm run setup:neon');
  console.log('   2. Verifica que la autenticación JWT funcione correctamente');
  console.log('   3. Realiza pruebas de login/registro sin Clerk');
  console.log('');
  console.log('💡 RECORDATORIO:');
  console.log('   • El sistema ahora usa JWT puro (sin Clerk)');
  console.log('   • Desarrollo: SQLite local');
  console.log('   • Producción: Neon PostgreSQL');
}

if (require.main === module) {
  main();
}

module.exports = { cleanFile, updatePackageJson, createCleanEnvTemplate }; 