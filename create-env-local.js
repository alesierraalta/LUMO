const fs = require('fs');
const path = require('path');

// Función para leer variables de entorno de un archivo
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  
  const buffer = fs.readFileSync(filePath);
  let content;
  
  // Detectar encoding y BOM
  if (buffer.length >= 2) {
    const bom = buffer.slice(0, 2);
    
    // UTF-16 LE BOM: FF FE
    if (bom[0] === 0xFF && bom[1] === 0xFE) {
      console.log(`Detected UTF-16 LE encoding in ${filePath}`);
      content = buffer.toString('utf16le').slice(1); // Remover BOM
    }
    // UTF-8 BOM: EF BB BF
    else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      console.log(`Detected UTF-8 with BOM in ${filePath}`);
      content = buffer.toString('utf8').slice(1); // Remover BOM
    }
    // UTF-8 sin BOM o texto plano
    else {
      content = buffer.toString('utf8');
    }
  } else {
    content = buffer.toString('utf8');
  }
  
  const env = {};
  
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Leer claves existentes de los archivos .env
const existingEnv = readEnvFile('.env');
const existingProdEnv = readEnvFile('.env.production');

console.log('\n=== CONFIGURACIÓN DE CLERK AUTHENTICATION ===');

// Determinar si estamos en entorno de desarrollo o producción
// Detectar el comando específico ejecutado
const isDevClerkCommand = process.argv.some(arg => arg.includes('dev:clerk'));
const isProdKeysCommand = process.argv.some(arg => arg.includes('dev:prod-keys')) || process.env.NODE_ENV === 'production';

let isDevelopment;
if (isProdKeysCommand) {
  isDevelopment = false; // Forzar producción para dev:prod-keys
} else if (isDevClerkCommand || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  isDevelopment = true; // Forzar desarrollo para dev:clerk o cuando NODE_ENV no está definido
} else {
  isDevelopment = process.env.NODE_ENV !== 'production';
}

console.log(`Entorno: ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`Debug - Comando detectado: ${isDevClerkCommand ? 'dev:clerk' : isProdKeysCommand ? 'dev:prod-keys' : 'default'}`);

// Función para validar si una clave es real y válida
function isValidClerkKey(key, type) {
  if (!key) return false;
  
  if (type === 'publishable') {
    const hasValidPrefix = key.startsWith('pk_test_') || key.startsWith('pk_live_');
    const hasMinimumLength = key.length > 20; // Más flexible con la longitud
    return hasValidPrefix && hasMinimumLength;
  } else if (type === 'secret') {
    const hasValidPrefix = key.startsWith('sk_test_') || key.startsWith('sk_live_');
    const hasMinimumLength = key.length > 20; // Más flexible con la longitud
    return hasValidPrefix && hasMinimumLength;
  }
  return false;
}

// Claves para entorno de desarrollo - solo usar variables de entorno
const devKeys = {
  publishable: existingEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_DEV_PUBLISHABLE_KEY,
  secret: existingEnv.CLERK_SECRET_KEY || process.env.CLERK_DEV_SECRET_KEY
};

// Claves para entorno de producción - solo usar variables de entorno
const prodKeys = {
  publishable: existingEnv.CLERK_PROD_PUBLISHABLE_KEY || existingProdEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PROD_PUBLISHABLE_KEY,
  secret: existingEnv.CLERK_PROD_SECRET_KEY || existingProdEnv.CLERK_SECRET_KEY || process.env.CLERK_PROD_SECRET_KEY
};

// Usar las claves apropiadas según el entorno
const keys = isDevelopment ? devKeys : prodKeys;
console.log(`Usando claves de: ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}`);

// Debug: mostrar qué claves se están usando
console.log(`Debug - Publishable key source: ${existingEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'existing .env' : 'fallback'}`);
console.log(`Debug - Publishable key: ${keys.publishable ? keys.publishable.substring(0, 30) : 'undefined'}...`);
console.log(`Debug - Secret key: ${keys.secret ? keys.secret.substring(0, 10) : 'undefined'}...`);
console.log(`Debug - Publishable key length: ${keys.publishable ? keys.publishable.length : 0}`);
console.log(`Debug - Secret key length: ${keys.secret ? keys.secret.length : 0}`);

// Validar las claves
const publishableKeyValid = isValidClerkKey(keys.publishable, 'publishable');
const secretKeyValid = isValidClerkKey(keys.secret, 'secret');

console.log(`Debug - Publishable key valid: ${publishableKeyValid}`);
console.log(`Debug - Secret key valid: ${secretKeyValid}`);

if (!keys.publishable || !keys.secret) {
  console.log('\n❌ ERROR: No se encontraron claves de Clerk en las variables de entorno');
  console.log('   Para usar Clerk Authentication necesitas:');
  console.log('   1. Crear una cuenta en https://clerk.com');
  console.log('   2. Obtener tus claves reales del dashboard');
  console.log('   3. Configurar las siguientes variables de entorno:');
  console.log('      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
  console.log('      - CLERK_SECRET_KEY=sk_test_...');
  console.log('\n   Para desarrollo sin autenticación, usa: npm run dev:no-auth');
  process.exit(1);
} else if (!publishableKeyValid || !secretKeyValid) {
  console.log('\n⚠️  ADVERTENCIA: Las claves de Clerk tienen formato inválido');
  console.log('   Verifica que las claves tengan el formato correcto:');
  console.log('   - Publishable key debe empezar con "pk_"');
  console.log('   - Secret key debe empezar con "sk_"');
  console.log('\n   Para desarrollo sin autenticación, usa: npm run dev:no-auth');
} else {
  console.log('\n✅ ENCONTRADAS claves válidas de Clerk en variables de entorno');
  console.log('   Las claves son válidas y deberían funcionar correctamente.');
}

// Valor de NEXT_PUBLIC_SKIP_CLERK_AUTH
const skipAuth = process.argv.includes('--skip-auth') ? 'true' : 'false';
console.log(`Omitir autenticación: ${skipAuth === 'true' ? 'SÍ' : 'NO'}`);

// Preservar otras variables de entorno del archivo existente
const preservedVars = {
  ...existingEnv,
  // Sobrescribir solo las variables de Clerk si están disponibles
  ...(keys.publishable && { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: keys.publishable }),
  ...(keys.secret && { CLERK_SECRET_KEY: keys.secret }),
  NEXT_PUBLIC_SKIP_CLERK_AUTH: skipAuth,
  NODE_ENV: isDevelopment ? 'development' : 'production'
};

// Generar contenido del .env.local preservando variables existentes
let envContent = '# Clerk Authentication Keys\n';
if (preservedVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  envContent += `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${preservedVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}\n`;
}
if (preservedVars.CLERK_SECRET_KEY) {
  envContent += `CLERK_SECRET_KEY=${preservedVars.CLERK_SECRET_KEY}\n`;
}
envContent += `NEXT_PUBLIC_SKIP_CLERK_AUTH=${preservedVars.NEXT_PUBLIC_SKIP_CLERK_AUTH}\n\n`;

// Añadir URLs de Clerk
envContent += '# Clerk URLs\n';
envContent += `NEXT_PUBLIC_CLERK_SIGN_IN_URL=${preservedVars.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'}\n`;
envContent += `NEXT_PUBLIC_CLERK_SIGN_UP_URL=${preservedVars.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'}\n`;
envContent += `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${preservedVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard'}\n`;
envContent += `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${preservedVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard'}\n\n`;

// Preservar variables de base de datos si existen
if (preservedVars.DATABASE_URL) {
  envContent += '# Database\n';
  envContent += `DATABASE_URL=${preservedVars.DATABASE_URL}\n`;
  if (preservedVars.DATABASE_URL_UNPOOLED) {
    envContent += `DATABASE_URL_UNPOOLED=${preservedVars.DATABASE_URL_UNPOOLED}\n`;
  }
  envContent += '\n';
}

// Preservar otras variables importantes
const importantVars = [
  'PGHOST', 'PGHOST_UNPOOLED', 'PGUSER', 'PGDATABASE', 'PGPASSWORD',
  'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_USER', 
  'POSTGRES_HOST', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE',
  'POSTGRES_URL_NO_SSL', 'POSTGRES_PRISMA_URL',
  'NEXT_PUBLIC_STACK_PROJECT_ID', 'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY', 'DEBUG_LOGS'
];

let hasOtherVars = false;
importantVars.forEach(varName => {
  if (preservedVars[varName]) {
    if (!hasOtherVars) {
      envContent += '# Otras variables de entorno\n';
      hasOtherVars = true;
    }
    envContent += `${varName}=${preservedVars[varName]}\n`;
  }
});

envContent += `\nNODE_ENV=${preservedVars.NODE_ENV}\n`;

// Ruta del archivo .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');

// Escribir el archivo
fs.writeFileSync(envLocalPath, envContent, 'utf8');

console.log(`\nArchivo .env.local creado en: ${envLocalPath}`);

// Mostrar un resumen de la configuración
console.log('\n=== RESUMEN DE CONFIGURACIÓN ===');
if (keys.publishable) {
  console.log(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${keys.publishable.substring(0, 10)}...`);
} else {
  console.log(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: NO CONFIGURADA`);
}
if (keys.secret) {
  console.log(`CLERK_SECRET_KEY: ${keys.secret.substring(0, 10)}...`);
} else {
  console.log(`CLERK_SECRET_KEY: NO CONFIGURADA`);
}
console.log(`NEXT_PUBLIC_SKIP_CLERK_AUTH: ${skipAuth}`);
console.log(`NODE_ENV: ${preservedVars.NODE_ENV}`);

console.log('\n=== COMANDOS DISPONIBLES ===');
console.log('npm run dev           - Ejecutar la aplicación con la configuración actual');
console.log('npm run dev:clerk     - Ejecutar con autenticación y claves de desarrollo');
console.log('npm run dev:no-auth   - Ejecutar sin autenticación');
console.log('npm run dev:prod-keys - Ejecutar con claves de producción');

if (!publishableKeyValid || !secretKeyValid) {
  console.log('\n=== CÓMO OBTENER CLAVES REALES ===');
  console.log('1. Ve a https://dashboard.clerk.com');
  console.log('2. Crea una cuenta o inicia sesión');
  console.log('3. Crea una nueva aplicación');
  console.log('4. Ve a la sección "API Keys"');
  console.log('5. Copia tu Publishable Key (pk_test_...) y Secret Key (sk_test_...)');
  console.log('6. Actualiza tu archivo .env con las claves reales');
}

console.log('\n=== CÓMO PROBAR LA APLICACIÓN ===');
if (skipAuth === 'true') {
  console.log('La aplicación se ejecutará SIN autenticación (modo de desarrollo).');
  console.log('Puedes acceder directamente sin iniciar sesión.');
} else {
  if (!publishableKeyValid || !secretKeyValid) {
    console.log('⚠️  La aplicación intentará usar autenticación pero FALLARÁ con claves placeholder.');
    console.log('   Para probar sin errores, usa: npm run dev:no-auth');
    console.log('   Para usar autenticación real, obtén claves de Clerk y actualiza tu archivo .env');
  } else {
    console.log('✅ La aplicación se ejecutará CON autenticación usando claves reales.');
    console.log('Podrás iniciar sesión usando Clerk Authentication.');
    console.log(`Usando claves de ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}.`);
  }
} 