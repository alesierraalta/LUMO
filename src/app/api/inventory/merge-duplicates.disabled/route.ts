import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/auth-options";
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
        const productToKeep = await prisma.inventoryItem.findUnique({
          where: { id: keepProductId }
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
            const productToMerge = await tx.inventoryItem.findUnique({
              where: { id: mergeId }
            });

            if (!productToMerge) return; // Skip if not found

            // Update any sales or stock movements to reference the product we're keeping
            await tx.$executeRaw`
              UPDATE "sales_items" 
              SET "inventoryItemId" = ${keepProductId}
              WHERE "inventoryItemId" = ${mergeId}
            `;
            
            await tx.$executeRaw`
              UPDATE "stock_movements" 
              SET "inventoryItemId" = ${keepProductId}
              WHERE "inventoryItemId" = ${mergeId}
            `;
            
            // Merge inventory quantities
            await tx.inventoryItem.update({
              where: { id: keepProductId },
              data: {
                quantity: {
                  increment: productToMerge.quantity || 0
                }
              }
            });
            
            // Finally, delete the duplicate product
            await tx.inventoryItem.delete({
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
  }
} 