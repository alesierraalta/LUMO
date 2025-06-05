#!/usr/bin/env node

/**
 * Test ImportSession Accessibility
 * 
 * Este script prueba si el modelo ImportSession es accesible
 * y si se pueden realizar operaciones básicas con él.
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

// Crear un ID único para esta prueba
const testId = uuidv4();
console.log(`🔍 Iniciando prueba de ImportSession con ID: ${testId}`);

async function main() {
  console.log('🔄 Creando cliente Prisma...');
  const prisma = new PrismaClient({
    log: ['error']
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar los modelos disponibles
    console.log('🔍 Verificando modelos disponibles...');
    const modelNames = Object.keys(prisma).filter(key => 
      !key.startsWith('_') && 
      !key.startsWith('$') && 
      typeof prisma[key] === 'object'
    );

    console.log(`📝 Modelos disponibles: ${modelNames.join(', ')}`);

    // Verificar si ImportSession existe
    if (!modelNames.includes('importSession')) {
      console.error('❌ El modelo ImportSession no existe en el cliente Prisma');
      console.log('⚠️ Esto puede indicar un problema con el esquema de Prisma o con la generación del cliente');
      await prisma.$disconnect();
      return false;
    }

    console.log('✅ El modelo ImportSession existe');

    // Intentar obtener un recuento de registros
    try {
      console.log('🔍 Contando registros de ImportSession...');
      const count = await prisma.importSession.count();
      console.log(`✅ Se encontraron ${count} registros de ImportSession`);
    } catch (error) {
      console.error('❌ Error al contar registros:', error);
      await prisma.$disconnect();
      return false;
    }

    // Intentar crear un registro de prueba
    try {
      console.log('🔍 Intentando crear un registro de prueba...');
      
      // Obtener un usuario administrador para la prueba
      const admin = await prisma.user.findFirst({
        where: {
          role: {
            name: 'admin'
          }
        }
      });
      
      if (!admin) {
        console.warn('⚠️ No se encontró un usuario administrador para la prueba');
        console.log('🔍 Buscando cualquier usuario...');
        
        const anyUser = await prisma.user.findFirst();
        
        if (!anyUser) {
          console.error('❌ No se encontraron usuarios para la prueba');
          await prisma.$disconnect();
          return false;
        }
        
        console.log(`✅ Usando usuario con ID: ${anyUser.id}`);
        
        // Crear un registro de prueba
        const testSession = await prisma.importSession.create({
          data: {
            id: testId,
            filePath: `/tmp/test-${testId}.xlsx`,
            status: 'test',
            totalItems: 0,
            successItems: 0,
            warningItems: 0,
            errorItems: 0,
            createdById: anyUser.id
          }
        });
        
        console.log(`✅ Registro de prueba creado con ID: ${testSession.id}`);
        
        // Eliminar el registro de prueba
        await prisma.importSession.delete({
          where: {
            id: testId
          }
        });
        
        console.log(`✅ Registro de prueba eliminado`);
      } else {
        console.log(`✅ Usando administrador con ID: ${admin.id}`);
        
        // Crear un registro de prueba
        const testSession = await prisma.importSession.create({
          data: {
            id: testId,
            filePath: `/tmp/test-${testId}.xlsx`,
            status: 'test',
            totalItems: 0,
            successItems: 0,
            warningItems: 0,
            errorItems: 0,
            createdById: admin.id
          }
        });
        
        console.log(`✅ Registro de prueba creado con ID: ${testSession.id}`);
        
        // Eliminar el registro de prueba
        await prisma.importSession.delete({
          where: {
            id: testId
          }
        });
        
        console.log(`✅ Registro de prueba eliminado`);
      }
    } catch (error) {
      console.error('❌ Error al manipular registros:', error);
      await prisma.$disconnect();
      return false;
    }

    console.log('✅ La prueba de ImportSession ha sido exitosa');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error('❌ Error al desconectar:', err);
    }
    return false;
  }
}

// Ejecutar la función principal
main()
  .then(success => {
    if (success) {
      console.log('✅ Prueba completada exitosamente');
      process.exit(0);
    } else {
      console.error('❌ La prueba ha fallado');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 