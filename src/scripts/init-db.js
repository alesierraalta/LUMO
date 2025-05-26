// Script para inicializar la base de datos con roles y permisos básicos
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Iniciando script de inicialización de base de datos...");
    
    // Verificar si ya existen roles para evitar duplicados
    const adminRoleExists = await prisma.role.findUnique({
      where: { name: 'admin' }
    });
    
    const viewerRoleExists = await prisma.role.findUnique({
      where: { name: 'viewer' }
    });
    
    // Crear roles si no existen
    if (!adminRoleExists) {
      console.log("Creando rol de administrador...");
      await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Acceso completo a todas las funcionalidades',
        }
      });
    } else {
      console.log("El rol de administrador ya existe.");
    }
    
    if (!viewerRoleExists) {
      console.log("Creando rol de visualizador...");
      await prisma.role.create({
        data: {
          name: 'viewer',
          description: 'Acceso de solo lectura a la aplicación',
        }
      });
    } else {
      console.log("El rol de visualizador ya existe.");
    }
    
    console.log("Inicialización completada con éxito!");
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 