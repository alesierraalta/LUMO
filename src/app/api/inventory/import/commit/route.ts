import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importService } from "@/lib/importService";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for item validation
const importItemSchema = z.object({
  rowId: z.number(),
  name: z.string().optional(),
  sku: z.string().min(1, "El SKU es requerido"),
  price: z.number().nullable(),
  cost: z.number().nullable(),
  quantity: z.number().nullable(),
  category: z.string().nullable(),
  location: z.string().nullable(),
  confidence: z.record(z.number()),
  originalData: z.record(z.any())
});

// Schema for request validation
const commitRequestSchema = z.object({
  userId: z.string(),
  items: z.array(importItemSchema),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
});

async function ensureImportTablesExist() {
  try {
    // Check if ImportSession table exists
    try {
      await prisma.prisma.$queryRawUnsafe("SELECT 1 FROM \"ImportSession\" LIMIT 1");
      return true; // Table exists
    } catch (error) {
      console.log("ImportSession table does not exist, creating required tables...");
      
      // Create ImportSession table
      await prisma.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSession" (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          status TEXT NOT NULL,
          totalRows INTEGER NOT NULL DEFAULT 0,
          processedRows INTEGER NOT NULL DEFAULT 0,
          createdRows INTEGER NOT NULL DEFAULT 0,
          updatedRows INTEGER NOT NULL DEFAULT 0,
          errorRows INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userId" TEXT,
          error TEXT
        )
      `);
      
      // Create ImportSessionItem table
      await prisma.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSessionItem" (
          id TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "rowNumber" INTEGER NOT NULL,
          status TEXT NOT NULL,
          data JSONB NOT NULL,
          error TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "ImportSessionItem_sessionId_fkey" 
          FOREIGN KEY ("sessionId") 
          REFERENCES "ImportSession"(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      
      console.log("Created import tables successfully");
      return true;
    }
  } catch (error) {
    console.error("Error ensuring import tables exist:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure import tables exist before proceeding
    await ensureImportTablesExist();
    
    // Parse and validate request body
    const body = await request.json();
    const { userId, items, notes, sessionId } = commitRequestSchema.parse(body);
    
    // Check user permissions
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Check inventory permissions
    const hasInventoryAccess = isAdmin(user) || hasPermission(user, 'page', 'inventory');
    
    if (!hasInventoryAccess) {
      return NextResponse.json(
        { message: "No tienes permiso para acceder a esta funcionalidad" },
        { status: 403 }
      );
    }
    
    // Process each item
    const results = {
      total: items.length,
      success: 0,
      warning: 0,
      error: 0,
      items: [] as any[]
    };
    
    // Acceder al cliente Prisma original
    const originalPrisma = prisma.prisma;
    
    for (const item of items) {
      try {
        // Validate essential fields
        if (!item.sku) {
          results.error++;
          results.items.push({
            rowId: item.rowId,
            name: item.name || 'unknown',
            sku: item.sku || 'unknown',
            status: "error",
            message: 'SKU es obligatorio',
            originalData: item.originalData,
          });
          continue;
        }
        
        // Get or create category if provided
        let categoryId = null;
        if (item.category) {
          const category = await originalPrisma.category.findFirst({
            where: { name: item.category },
          });
          
          if (category) {
            categoryId = category.id;
          } else {
            // Create new category
            const newCategory = await originalPrisma.category.create({
              data: {
                name: item.category,
              },
            });
            categoryId = newCategory?.id || null;
          }
        }
        
        // Get or create location if provided
        let locationId = null;
        if (item.location) {
          const location = await originalPrisma.location.findFirst({
            where: { name: item.location },
          });
          
          if (location) {
            locationId = location.id;
          } else {
            // Create new location
            const newLocation = await originalPrisma.location.create({
              data: {
                name: item.location,
              },
            });
            locationId = newLocation?.id || null;
          }
        }
        
        // Prepare product data
        const productData: any = {
          sku: item.sku,
          name: item.name || item.sku, // Usar SKU como nombre si no hay nombre
          price: item.price || 0,
          cost: item.cost || 0,
          quantity: item.quantity || 0,
          categoryId: categoryId,
          locationId: locationId,
          active: true,
          updatedAt: new Date(),
        };
        
        // Check if product already exists by SKU
        const existingProduct = await originalPrisma.inventoryItem.findFirst({
          where: { sku: item.sku },
        });
        
        if (existingProduct) {
          // Update existing product
          const updatedProduct = await originalPrisma.inventoryItem.update({
            where: { id: existingProduct.id },
            data: productData,
          });
          
          // Record price change if different
          if (item.price !== null && item.price !== existingProduct.price) {
            await originalPrisma.priceHistory.create({
              data: {
                inventoryItemId: existingProduct.id,
                oldPrice: existingProduct.price,
                newPrice: item.price,
                userId: userId,
              }
            });
          }
          
          // Record quantity movement if different
          if (item.quantity !== null && item.quantity !== existingProduct.quantity) {
            const difference = item.quantity - existingProduct.quantity;
            await originalPrisma.stockMovement.create({
              data: {
                inventoryItemId: existingProduct.id,
                quantity: difference,
                type: "ADJUSTMENT",
                userId: userId,
                notes: `Importación desde archivo`,
              }
            });
          }
          
          results.success++;
          results.items.push({
            rowId: item.rowId,
            name: item.name || item.sku,
            sku: item.sku,
            status: "success",
            message: 'Producto actualizado correctamente',
            originalData: item.originalData,
          });
        } else {
          // Create new product
          const newProduct = await originalPrisma.inventoryItem.create({
            data: productData,
          });
          
          // Record initial quantity if provided
          if (item.quantity && item.quantity > 0) {
            await originalPrisma.stockMovement.create({
              data: {
                inventoryItemId: newProduct.id,
                quantity: item.quantity,
                type: "INITIAL",
                userId: userId,
                notes: `Importación inicial desde archivo`,
              }
            });
          }
          
          results.success++;
          results.items.push({
            rowId: item.rowId,
            name: item.name || item.sku,
            sku: item.sku,
            status: "success",
            message: 'Producto creado correctamente',
            originalData: item.originalData,
          });
        }
      } catch (error) {
        console.error("Error processing item:", error);
        results.error++;
        results.items.push({
          rowId: item.rowId,
          name: item.name || 'unknown',
          sku: item.sku || 'unknown',
          status: "error",
          message: error instanceof Error ? error.message : "Error al procesar el producto",
          originalData: item.originalData,
        });
      }
    }
    
    // Update import session if provided
    if (sessionId) {
      await importService.updateImportSession(sessionId, {
        status: "completed",
        successItems: results.success,
        warningItems: results.warning,
        errorItems: results.error,
        completedAt: new Date(),
      });
      
      // Create detail records for the import session
      for (const resultItem of results.items) {
        await importService.createImportSessionDetail({
          sessionId,
          name: resultItem.name,
          sku: resultItem.sku,
          status: resultItem.status,
          message: resultItem.message,
          originalData: resultItem.originalData,
          importedData: resultItem.importedData || null,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      total: results.total,
      successCount: results.success,
      warning: results.warning,
      error: results.error,
      message: "Importación completada"
    });
    
  } catch (error) {
    console.error("Error committing import:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al finalizar la importación" },
      { status: 500 }
    );
  }
} 