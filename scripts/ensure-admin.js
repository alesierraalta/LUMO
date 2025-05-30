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

const prisma = new PrismaClient();

async function ensureAdminUser() {
  try {
    console.log('👤 Verificando usuario administrador...');
    
    // Buscar usuario administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' }
    });
    
    if (!adminUser) {
      console.log('⚠️ Usuario administrador no encontrado, creándolo...');
      
      // Buscar rol de administrador
      let adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      // Si no existe el rol, crearlo
      if (!adminRole) {
        console.log('⚠️ Rol de administrador no encontrado, creándolo...');
        
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
      }
      
      // Crear usuario administrador
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
    } else {
      console.log('✅ Usuario administrador encontrado:', adminUser.email);
      
      // Asegurar que el usuario tenga rol de administrador
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
    }
    
    console.log('🔒 Verificación de usuario administrador completada');
  } catch (error) {
    console.error('❌ Error al verificar usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
ensureAdminUser().catch(e => {
  console.error('Error en el script:', e);
  process.exit(1);
}); 