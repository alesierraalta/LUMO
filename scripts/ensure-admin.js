/**
 * Script para asegurar que el usuario administrador exista
 * 
 * Uso:
 *   node scripts/ensure-admin.js
 * 
 * Este script verifica si el usuario administrador existe en la base de datos.
 * Si no existe, lo crea con las credenciales por defecto.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Información del entorno
console.log('🔍 Verificando entorno para usuario administrador...');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  console.error('⚠️ No se puede verificar/crear usuario administrador sin conexión a la base de datos');
  process.exit(1);
}

console.log(`- DATABASE_URL: [Configurada]`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[Configurado]' : '[No configurado]'}`);

// Crear cliente Prisma con configuración de logging reducida
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function ensureAdminUser() {
  try {
    console.log('👤 Verificando usuario administrador root...');
    
    // Comprobar conexión a la base de datos
    try {
      console.log('🔌 Conectando a la base de datos...');
      await prisma.$connect();
      console.log('✅ Conexión a la base de datos exitosa');
    } catch (connectionError) {
      console.error('❌ Error al conectar a la base de datos:', connectionError.message);
      process.exit(1);
    }
    
    // Verificar estructura de la base de datos
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Usuarios existentes: ${userCount}`);
    } catch (schemaError) {
      console.error('❌ Error al verificar la estructura de la base de datos:', schemaError.message);
      if (schemaError.message.includes('does not exist')) {
        console.error('⚠️ Las tablas de la base de datos no existen.');
        console.error('⚠️ Ejecuta "npx prisma db push" para crear las tablas.');
      }
      process.exit(1);
    }
    
    // Buscar usuario administrador
    let adminUser;
    try {
      adminUser = await prisma.user.findUnique({
        where: { email: 'alesierraalta@gmail.com' }
      });
    } catch (findError) {
      console.error('❌ Error al buscar usuario administrador:', findError.message);
      process.exit(1);
    }
    
    if (!adminUser) {
      console.log('⚠️ Usuario administrador ROOT no encontrado, creándolo...');
      
      // Crear usuario administrador con el esquema del sistema
      try {
        const passwordHash = await bcrypt.hash('admin123', 12);
        const newAdmin = await prisma.user.create({
          data: {
            email: 'alesierraalta@gmail.com',
            name: 'Alejandro Sierra (ROOT)',
            password: passwordHash,
            role: 'ADMIN',
            isActive: true
          }
        });
        
        console.log('✅ Usuario administrador ROOT creado exitosamente:');
        console.log('   - Email: alesierraalta@gmail.com');
        console.log('   - Password: admin123');
        console.log('   - Role: ADMIN');
        console.log('   - Status: ACTIVE');
      } catch (createUserError) {
        console.error('❌ Error al crear usuario administrador:', createUserError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Usuario administrador ROOT encontrado:', adminUser.email);
      
      // Asegurar que el usuario tenga configuración correcta
      try {
        // Actualizar contraseña para asegurar que funcione
        const passwordHash = await bcrypt.hash('admin123', 12);
        const updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            password: passwordHash,
            role: 'ADMIN',
            isActive: true,
            name: 'Alejandro Sierra (ROOT)'
          }
        });
        console.log('✅ Configuración de usuario ROOT actualizada para', updatedUser.email);
        console.log('   - Password actualizada: admin123');
        console.log('   - Role: ADMIN');
        console.log('   - Status: ACTIVE');
      } catch (updateError) {
        console.error('❌ Error al actualizar usuario administrador:', updateError.message);
      }
    }
    
    console.log('✅ Verificación de usuario administrador ROOT completada');
    
  } catch (globalError) {
    console.error('❌ Error global en ensureAdminUser:', globalError.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ensureAdminUser()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = ensureAdminUser; 