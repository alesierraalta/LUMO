import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    console.log("🔧 Iniciando migración de ubicaciones...");

    // 1. Verificar y crear ubicación por defecto si es necesario
    let defaultLocation = await prisma.location.findFirst({
      where: { name: "Almacén Principal" }
    });

    if (!defaultLocation) {
      defaultLocation = await prisma.location.create({
        data: {
          name: "Almacén Principal",
          description: "Ubicación principal del almacén",
          isActive: true
        }
      });
      console.log("✅ Ubicación por defecto 'Almacén Principal' creada");
    } else {
      console.log("✅ Ubicación 'Almacén Principal' ya existe");
    }

    // 2. Encontrar productos sin ubicación
    const productsWithoutLocation = await prisma.inventoryItem.findMany({
      where: {
        locationId: null,
        active: true
      },
      select: {
        id: true,
        name: true,
        sku: true
      }
    });

    console.log(`📦 Productos sin ubicación encontrados: ${productsWithoutLocation.length}`);

    if (productsWithoutLocation.length > 0) {
      // 3. Asignar ubicación por defecto a productos sin ubicación
      const updateResult = await prisma.inventoryItem.updateMany({
        where: {
          locationId: null,
          active: true
        },
        data: {
          locationId: defaultLocation.id
        }
      });

      console.log(`✅ ${updateResult.count} productos asignados a 'Almacén Principal'`);

      return NextResponse.json({
        success: true,
        message: `${updateResult.count} productos asignados a 'Almacén Principal'`,
        defaultLocation: defaultLocation.name,
        updatedProducts: updateResult.count,
        productsList: productsWithoutLocation.map(p => ({ name: p.name, sku: p.sku }))
      });
    } else {
      console.log("✅ Todos los productos ya tienen ubicación asignada");
      
      return NextResponse.json({
        success: true,
        message: "Todos los productos ya tienen ubicación asignada",
        updatedProducts: 0
      });
    }

  } catch (error) {
    console.error("❌ Error en migración de ubicaciones:", error);
    return NextResponse.json(
      { error: "Failed to migrate locations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 