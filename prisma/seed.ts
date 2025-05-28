import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seeder...");
  
  // Crear roles básicos
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Acceso completo a todas las funcionalidades',
    },
  });
  
  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Acceso de solo lectura a la aplicación',
    },
  });
  
  // Crear permisos básicos
  const readInventoryPermission = await prisma.permission.upsert({
    where: { name: 'inventory:read' },
    update: {},
    create: {
      name: 'inventory:read',
      description: 'Permite leer datos de inventario',
      resource: 'inventory',
      action: 'read',
    },
  });
  
  const writeInventoryPermission = await prisma.permission.upsert({
    where: { name: 'inventory:write' },
    update: {},
    create: {
      name: 'inventory:write',
      description: 'Permite escribir datos de inventario',
      resource: 'inventory',
      action: 'write',
    },
  });
  
  // Asignar permisos a roles
  // Admin tiene todos los permisos
  await prisma.rolePermission.upsert({
    where: { 
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: readInventoryPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: readInventoryPermission.id,
    },
  });
  
  await prisma.rolePermission.upsert({
    where: { 
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: writeInventoryPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: writeInventoryPermission.id,
    },
  });
  
  // Viewer solo tiene permiso de lectura
  await prisma.rolePermission.upsert({
    where: { 
      roleId_permissionId: {
        roleId: viewerRole.id,
        permissionId: readInventoryPermission.id,
      },
    },
    update: {},
    create: {
      roleId: viewerRole.id,
      permissionId: readInventoryPermission.id,
    },
  });
  
  console.log("Seeder completado con éxito!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 