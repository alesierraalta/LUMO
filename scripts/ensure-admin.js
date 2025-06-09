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
const { execSync } = require('child_process');

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
    let tablesExist = false;
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Usuarios existentes: ${userCount}`);
      tablesExist = true;
    } catch (schemaError) {
      console.log('⚠️ Las tablas de la base de datos no existen - creando schema...');
      
      if (schemaError.message.includes('does not exist')) {
        try {
          console.log('🔧 Ejecutando migración de schema...');
          execSync('npx prisma db push --force-reset', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Schema de base de datos creado exitosamente');
          tablesExist = true;
        } catch (migrationError) {
          console.error('❌ Error al crear schema de base de datos:', migrationError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Error desconocido en base de datos:', schemaError.message);
        process.exit(1);
      }
    }
    
    if (!tablesExist) {
      console.error('❌ No se pudieron crear las tablas de la base de datos');
      process.exit(1);
    }
    
    // Verificar conteo de usuarios después de crear schema
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Usuarios en base de datos: ${userCount}`);
    } catch (countError) {
      console.error('❌ Error al contar usuarios:', countError.message);
      process.exit(1);
    }
    
    // Asegurar que el rol ADMIN existe
    let adminRole;
    try {
      console.log('👑 Verificando rol ADMIN...');
      adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
      });
      
      if (!adminRole) {
        console.log('⚠️ Rol ADMIN no encontrado, creándolo...');
        adminRole = await prisma.role.create({
          data: {
            name: 'ADMIN',
            description: 'Administrador del sistema con acceso completo',
            isSystem: true,
            isActive: true
          }
        });
        console.log('✅ Rol ADMIN creado exitosamente');
      } else {
        console.log('✅ Rol ADMIN encontrado:', adminRole.name);
      }
    } catch (roleError) {
      console.error('❌ Error al gestionar rol ADMIN:', roleError.message);
      process.exit(1);
    }
    
    // Buscar usuario administrador
    let adminUser;
    try {
      adminUser = await prisma.user.findUnique({
        where: { email: 'alesierraalta@gmail.com' },
        include: { role: true }
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
            roleId: adminRole.id,
            isActive: true
          },
          include: { role: true }
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
        // Actualizar contraseña y rol para asegurar que funcione
        const passwordHash = await bcrypt.hash('admin123', 12);
        const updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            password: passwordHash,
            roleId: adminRole.id,
            isActive: true,
            name: 'Alejandro Sierra (ROOT)'
          },
          include: { role: true }
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