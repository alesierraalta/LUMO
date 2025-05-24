// Script para migrar ubicaciones de texto libre a ubicaciones relacionales
// Ejecutar con: npx ts-node src/scripts/migrate-locations.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLocations() {
  console.log("🚀 Iniciando migración de ubicaciones...");

  try {
    // 1. Obtener todos los productos con ubicaciones existentes
    const productsWithLocations = await prisma.inventoryItem.findMany({
      where: {
        AND: [
          { location: { not: null } },
          { location: { not: "" } },
        ],
      },
      select: {
        id: true,
        location: true,
        locationId: true,
      },
    });

    console.log(`📦 Encontrados ${productsWithLocations.length} productos con ubicaciones`);

    // 2. Obtener valores únicos de ubicaciones
    const locationNames: string[] = [];
    
    for (const product of productsWithLocations) {
      if (product.location && product.location.trim() !== "" && !locationNames.includes(product.location.trim())) {
        locationNames.push(product.location.trim());
      }
    }

    console.log(`📍 Ubicaciones únicas encontradas: ${locationNames.length}`);
    console.log("Ubicaciones:", locationNames);

    // 3. Crear ubicaciones en la base de datos si no existen
    let createdCount = 0;
    
    for (const locationName of locationNames) {
      try {
        // Verificar si ya existe
        const existingLocation = await prisma.location.findUnique({
          where: { name: locationName }
        });

        if (!existingLocation) {
          // Crear nueva ubicación
          const newLocation = await prisma.location.create({
            data: {
              name: locationName,
              description: `Ubicación migrada automáticamente desde: "${locationName}"`,
              isActive: true,
            },
          });
          createdCount++;
          console.log(`✅ Creada ubicación: "${newLocation.name}"`);
        } else {
          console.log(`ℹ️  Ubicación ya existe: "${existingLocation.name}"`);
        }
      } catch (error) {
        console.error(`❌ Error creando ubicación "${locationName}":`, error);
      }
    }

    console.log(`\n🏗️  ${createdCount} nuevas ubicaciones creadas`);

    // 4. Actualizar productos para usar locationId
    let migratedCount = 0;
    let errorCount = 0;

    for (const product of productsWithLocations) {
      if (!product.location || product.locationId) {
        // Saltar si no tiene ubicación o ya tiene locationId
        continue;
      }

      try {
        // Buscar la ubicación correspondiente
        const location = await prisma.location.findUnique({
          where: { name: product.location.trim() }
        });

        if (location) {
          // Actualizar el producto con el locationId
          await prisma.inventoryItem.update({
            where: { id: product.id },
            data: {
              locationId: location.id,
            },
          });
          migratedCount++;
          
          if (migratedCount % 10 === 0) {
            console.log(`📦 Migrados ${migratedCount} productos...`);
          }
        } else {
          console.warn(`⚠️  No se encontró ubicación para producto ${product.id}: "${product.location}"`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error actualizando producto ${product.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumen de migración:`);
    console.log(`✅ Productos migrados: ${migratedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
    // 5. Verificar la migración
    const verificationCount = await prisma.inventoryItem.count({
      where: {
        AND: [
          { location: { not: null } },
          { location: { not: "" } },
          { locationId: { not: null } }
        ]
      }
    });

    console.log(`🔍 Verificación: ${verificationCount} productos tienen ambos campos (location y locationId)`);

    // 6. Mostrar estadísticas finales
    const totalLocations = await prisma.location.count();
    const productsWithLocationId = await prisma.inventoryItem.count({
      where: { locationId: { not: null } }
    });

    console.log(`\n📈 Estadísticas finales:`);
    console.log(`🏢 Total de ubicaciones en sistema: ${totalLocations}`);
    console.log(`📦 Productos con ubicación asignada: ${productsWithLocationId}`);
    
    console.log("\n✨ Migración completada exitosamente!");

  } catch (error) {
    console.error("💥 Error durante la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para revertir la migración si es necesario
async function revertMigration() {
  console.log("🔄 Revirtiendo migración...");

  try {
    // Limpiar locationId de todos los productos
    const result = await prisma.inventoryItem.updateMany({
      where: { locationId: { not: null } },
      data: { locationId: null }
    });

    console.log(`📦 ${result.count} productos actualizados (locationId removido)`);

    // Opcional: Eliminar ubicaciones creadas por migración
    const deleteResult = await prisma.location.deleteMany({
      where: {
        description: {
          startsWith: "Ubicación migrada automáticamente"
        }
      }
    });

    console.log(`🗑️  ${deleteResult.count} ubicaciones migradas eliminadas`);
    console.log("✅ Migración revertida exitosamente");

  } catch (error) {
    console.error("❌ Error revirtiendo migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "revert") {
    await revertMigration();
  } else {
    await migrateLocations();
  }
}

// Ejecutar el script
main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
}); 