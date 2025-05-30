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
console.log('🔍 Diagnóstico del entorno:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '[Configurada]' : '[No configurada]'}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[Configurado]' : '[No configurado]'}`);
console.log(`- Directorio: ${process.cwd()}`);

// Crear cliente Prisma con más opciones de diagnóstico
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log de consultas para diagnóstico
prisma.$on('query', (e) => {
  console.log('🔄 Query: ' + e.query);
});

prisma.$on('error', (e) => {
  console.error('❌ Error Prisma: ', e);
});

async function ensureAdminUser() {
  try {
    console.log('👤 Verificando usuario administrador...');
    
    // Comprobar conexión a la base de datos
    try {
      console.log('🔌 Conectando a la base de datos...');
      await prisma.$connect();
      console.log('✅ Conexión a la base de datos exitosa');
    } catch (connectionError) {
      console.error('❌ Error al conectar a la base de datos:', connectionError);
      process.exit(1);
    }
    
    // Verificar estructura de la base de datos
    try {
      console.log('🔍 Verificando tablas en la base de datos...');
      const userCount = await prisma.user.count();
      const roleCount = await prisma.role.count();
      const permissionCount = await prisma.permission.count();
      
      console.log(`📊 Estadísticas de la base de datos:`);
      console.log(`- Usuarios: ${userCount}`);
      console.log(`- Roles: ${roleCount}`);
      console.log(`- Permisos: ${permissionCount}`);
    } catch (schemaError) {
      console.error('❌ Error al verificar la estructura de la base de datos:', schemaError);
      if (schemaError.message.includes('does not exist')) {
        console.error('⚠️ Es posible que la base de datos no esté inicializada o no tenga las tablas necesarias.');
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
      console.error('❌ Error al buscar usuario administrador:', findError);
      process.exit(1);
    }
    
    if (!adminUser) {
      console.log('⚠️ Usuario administrador no encontrado, creándolo...');
      
      // Buscar rol de administrador
      let adminRole;
      try {
        adminRole = await prisma.role.findUnique({
          where: { name: 'admin' }
        });
      } catch (findRoleError) {
        console.error('❌ Error al buscar rol de administrador:', findRoleError);
        process.exit(1);
      }
      
      // Si no existe el rol, crearlo
      if (!adminRole) {
        console.log('⚠️ Rol de administrador no encontrado, creándolo...');
        
        try {
          adminRole = await prisma.role.create({
            data: {
              name: 'admin',
              description: 'Acceso completo a todas las funcionalidades'
            }
          });
          
          // Crear permiso básico
          const adminPermission = await prisma.permission.create({
            data: {
              name: 'admin:all',
              description: 'Acceso completo de administrador',
              resource: 'admin',
              action: 'all'
            }
          });
          
          // Asignar permiso al rol
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: adminPermission.id
            }
          });
          
          console.log('✅ Rol de administrador creado con permisos');
        } catch (createRoleError) {
          console.error('❌ Error al crear rol de administrador:', createRoleError);
          process.exit(1);
        }
      }
      
      // Crear usuario administrador
      try {
        const passwordHash = await bcrypt.hash('admin123', 12);
        const newAdmin = await prisma.user.create({
          data: {
            email: 'alesierraalta@gmail.com',
            passwordHash: passwordHash,
            firstName: 'Alejandro',
            lastName: 'Sierra',
            roleId: adminRole.id,
            isActive: true,
            isEmailVerified: true
          }
        });
        
        console.log('✅ Usuario administrador creado exitosamente:');
        console.log('   - Email:', newAdmin.email);
        console.log('   - Nombre:', newAdmin.firstName, newAdmin.lastName);
        console.log('   - Password: admin123');
      } catch (createUserError) {
        console.error('❌ Error al crear usuario administrador:', createUserError);
        process.exit(1);
      }
    } else {
      console.log('✅ Usuario administrador encontrado:', adminUser.email);
      
      // Asegurar que el usuario tenga rol de administrador
      try {
        const adminRole = await prisma.role.findUnique({
          where: { name: 'admin' }
        });
        
        if (adminRole && adminUser.roleId !== adminRole.id) {
          const updatedUser = await prisma.user.update({
            where: { id: adminUser.id },
            data: { roleId: adminRole.id }
          });
          console.log('✅ Rol de administrador actualizado para', updatedUser.email);
        }
        
        // Actualizar contraseña para asegurar que funcione
        const passwordHash = await bcrypt.hash('admin123', 12);
        const updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            passwordHash: passwordHash,
            isActive: true,
            isEmailVerified: true
          }
        });
        console.log('✅ Contraseña y estado de cuenta actualizados para', updatedUser.email);
      } catch (updateError) {
        console.error('❌ Error al actualizar usuario administrador:', updateError);
        process.exit(1);
      }
    }
    
    console.log('🔒 Verificación de usuario administrador completada');
  } catch (error) {
    console.error('❌ Error general al verificar usuario administrador:', error);
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Error al desconectar de la base de datos:', disconnectError);
    }
  }
}

// Ejecutar la función principal
ensureAdminUser().catch(e => {
  console.error('❌ Error crítico en el script:', e);
  process.exit(1);
}); 