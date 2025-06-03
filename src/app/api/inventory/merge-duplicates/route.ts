import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { checkPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

interface MergeGroup {
  name: string;
  keepProductId: string;
  mergeProductIds: string[];
}

interface MergeRequest {
  mergeData: MergeGroup[];
}

export async function POST(request: Request) {
  try {
    // Check authentication and permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has permission to manage inventory
    const hasPermission = await checkPermission(session.user.id, "inventory:manage");
    if (!hasPermission) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json() as MergeRequest;
    const { mergeData } = body;

    if (!mergeData || !Array.isArray(mergeData)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Process each merge group
    let mergedCount = 0;
    let errorCount = 0;

    for (const group of mergeData) {
      try {
        // Extract data
        const { keepProductId, mergeProductIds } = group;
        
        // Check if data is valid
        if (!keepProductId || !mergeProductIds || !mergeProductIds.length) {
          errorCount++;
          continue;
        }

        // Get the product to keep
        const productToKeep = await prisma.product.findUnique({
          where: { id: keepProductId },
          include: { inventory: true }
        });

        if (!productToKeep) {
          errorCount++;
          continue;
        }

        // Process each product to merge
        for (const mergeId of mergeProductIds) {
          // Use a transaction to ensure data integrity
          await prisma.$transaction(async (tx) => {
            // Get the product to merge
            const productToMerge = await tx.product.findUnique({
              where: { id: mergeId },
              include: { inventory: true }
            });

            if (!productToMerge) return; // Skip if not found

            // Update any sales or inventory movements to reference the product we're keeping
            await tx.$executeRaw`
              UPDATE "sales_items" 
              SET "productId" = ${keepProductId}
              WHERE "productId" = ${mergeId}
            `;
            
            await tx.$executeRaw`
              UPDATE "inventory_movements" 
              SET "productId" = ${keepProductId}
              WHERE "productId" = ${mergeId}
            `;
            
            // If the product to merge has inventory, merge it with the one we're keeping
            if (productToMerge.inventory) {
              // If productToKeep doesn't have inventory yet, create it
              if (!productToKeep.inventory) {
                await tx.inventoryItem.create({
                  data: {
                    productId: keepProductId,
                    quantity: productToMerge.inventory.quantity,
                    minStockLevel: productToMerge.inventory.minStockLevel
                  }
                });
              } else {
                // Merge inventory quantities
                await tx.inventoryItem.update({
                  where: { id: productToKeep.inventory.id },
                  data: {
                    quantity: {
                      increment: productToMerge.inventory.quantity
                    }
                  }
                });
              }
              
              // Delete the duplicate's inventory
              await tx.inventoryItem.delete({
                where: { id: productToMerge.inventory.id }
              });
            }
            
            // Finally, delete the duplicate product
            await tx.product.delete({
              where: { id: mergeId }
            });
          });
          
          mergedCount++;
        }
      } catch (error) {
        console.error("Error merging group:", error);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true,
      mergedCount,
      errorCount
    });
  } catch (error) {
    console.error("Error merging duplicates:", error);
    return NextResponse.json({ error: "Failed to merge duplicates" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 