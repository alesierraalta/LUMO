import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for item validation
const importItemSchema = z.object({
  rowId: z.number(),
  name: z.string().min(1, "El nombre es requerido"),
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

export async function POST(request: NextRequest) {
  try {
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
    
    for (const item of items) {
      try {
        // Check if product already exists by SKU
        const existingProduct = await prisma?.inventoryItem.findFirst({
          where: { sku: item.sku },
        });
        
        // Get or create category if provided
        let categoryId = null;
        if (item.category) {
          const category = await prisma?.category.findFirst({
            where: { name: { equals: item.category, mode: 'insensitive' } },
          });
          
          if (category) {
            categoryId = category.id;
          } else {
            // Create new category
            const newCategory = await prisma?.category.create({
              data: {
                name: item.category,
                createdBy: userId,
              },
            });
            categoryId = newCategory?.id || null;
          }
        }
        
        // Get or create location if provided
        let locationId = null;
        if (item.location) {
          const location = await prisma?.location.findFirst({
            where: { name: { equals: item.location, mode: 'insensitive' } },
          });
          
          if (location) {
            locationId = location.id;
          } else {
            // Create new location
            const newLocation = await prisma?.location.create({
              data: {
                name: item.location,
                createdBy: userId,
              },
            });
            locationId = newLocation?.id || null;
          }
        }
        
        if (existingProduct) {
          // Update existing product
          const updatedProduct = await prisma?.inventoryItem.update({
            where: { id: existingProduct.id },
            data: {
              name: item.name,
              price: item.price || existingProduct.price,
              cost: item.cost || existingProduct.cost,
              quantity: item.quantity !== null ? item.quantity : existingProduct.quantity,
              categoryId: categoryId || existingProduct.categoryId,
              locationId: locationId || existingProduct.locationId,
              lastUpdatedBy: userId,
              updatedAt: new Date(),
            },
          });
          
          // Log stock movement if quantity changed
          if (item.quantity !== null && item.quantity !== existingProduct.quantity) {
            await prisma?.stockMovement.create({
              data: {
                inventoryItemId: existingProduct.id,
                quantity: item.quantity - existingProduct.quantity,
                type: "IMPORT",
                notes: `Importación: ${notes || "Actualización de inventario"}`,
                userId,
                createdBy: userId,
              },
            });
          }
          
          results.success++;
          results.items.push({
            rowId: item.rowId,
            name: item.name,
            sku: item.sku,
            status: "success",
            message: "Producto actualizado correctamente",
            importedData: updatedProduct,
            originalData: item.originalData,
          });
          
        } else {
          // Create new product
          const newProduct = await prisma?.inventoryItem.create({
            data: {
              name: item.name,
              sku: item.sku,
              price: item.price || 0,
              cost: item.cost || 0,
              quantity: item.quantity || 0,
              categoryId: categoryId,
              locationId: locationId,
              active: true,
              createdBy: userId,
              lastUpdatedBy: userId,
            },
          });
          
          // Log stock movement if quantity provided
          if (item.quantity && item.quantity > 0) {
            await prisma?.stockMovement.create({
              data: {
                inventoryItemId: newProduct?.id || "",
                quantity: item.quantity,
                type: "IMPORT",
                notes: `Importación: ${notes || "Nuevo producto"}`,
                userId,
                createdBy: userId,
              },
            });
          }
          
          results.success++;
          results.items.push({
            rowId: item.rowId,
            name: item.name,
            sku: item.sku,
            status: "success",
            message: "Producto creado correctamente",
            importedData: newProduct,
            originalData: item.originalData,
          });
        }
        
      } catch (error) {
        console.error(`Error processing item ${item.sku}:`, error);
        results.error++;
        results.items.push({
          rowId: item.rowId,
          name: item.name,
          sku: item.sku,
          status: "error",
          message: error instanceof Error ? error.message : "Error al procesar el producto",
          originalData: item.originalData,
        });
      }
    }
    
    // Update import session if provided
    if (sessionId) {
      await prisma?.importSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          successItems: results.success,
          warningItems: results.warning,
          errorItems: results.error,
          completedAt: new Date(),
        },
      });
      
      // Create detail records for the import session
      for (const resultItem of results.items) {
        await prisma?.importSessionDetail.create({
          data: {
            sessionId,
            name: resultItem.name,
            sku: resultItem.sku,
            status: resultItem.status,
            message: resultItem.message,
            originalData: JSON.stringify(resultItem.originalData),
            importedData: resultItem.importedData ? JSON.stringify(resultItem.importedData) : null,
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      total: results.total,
      success: results.success,
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