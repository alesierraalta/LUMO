import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serializeDecimal } from "@/lib/utils";

// Validation schema for the request body
const financialsUpdateSchema = z.object({
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  margin: z.number().optional(),
  changeReason: z.string().optional(),
  inventoryItemId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the raw body
    console.log("Raw body:", body);
    
    // Validate request body
    const validation = financialsUpdateSchema.safeParse(body);
    
    // Log validation results
    console.log("Validation success:", validation.success);
    
    if (!validation.success) {
      console.log("Validation errors:", validation.error.issues);
      return NextResponse.json(
        { success: false, error: "Invalid data", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { price, cost, margin, changeReason, inventoryItemId } = validation.data;
    
    // Log the parsed data
    console.log("Parsed data:", { price, cost, margin, changeReason, inventoryItemId });
    
    // 1. Get the current inventory item (no transaction)
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!currentItem) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }
    
    console.log("Current item found:", currentItem.id);
    
    // 2. Update inventory item directly (no transaction)
    const updateData: any = {};
    if (price !== undefined) updateData.price = price;
    if (cost !== undefined) updateData.cost = cost;
    if (margin !== undefined) updateData.margin = margin;
    
    console.log("Update data:", updateData);
    
    try {
      // Simple update without transaction
      const updated = await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: updateData,
      });
      
      console.log("Item updated successfully");
      
      // 3. Only try to create price history if item update succeeded
      try {
        // Find or get a default system user
        let systemUser = null;
        try {
          // First try to find an existing system user
          systemUser = await prisma.user.findFirst({
            where: { email: 'sistema@lumo.local' }
          });
          
          // If no system user exists, create one
          if (!systemUser) {
            // First find the viewer role
            const viewerRole = await prisma.role.findUnique({
              where: { name: 'viewer' }
            });
            
            if (viewerRole) {
              systemUser = await prisma.user.create({
                data: {
                  clerkId: 'system-user',
                  email: 'sistema@lumo.local',
                  firstName: 'Sistema',
                  lastName: 'LUMO',
                  roleId: viewerRole.id
                }
              });
              console.log("Created system user for operations");
            }
          }
        } catch (userError) {
          console.error("Error finding/creating system user:", userError);
          // Continue without system user if there's an error
        }
        
        const historyData = {
          inventoryItemId: inventoryItemId,
          oldPrice: currentItem.price,
          newPrice: price !== undefined ? price : currentItem.price,
          oldCost: currentItem.cost,
          newCost: cost !== undefined ? cost : currentItem.cost,
          oldMargin: currentItem.margin,
          newMargin: margin !== undefined ? margin : currentItem.margin,
          changeReason: changeReason || "Test update",
          // Use system user if available
          ...(systemUser ? { userId: systemUser.id } : {})
        };
        
        console.log("Creating price history with:", historyData);
        
        // Create price history record separately
        const priceHistory = await prisma.priceHistory.create({
          data: historyData
        });
        
        console.log("Price history created successfully");
        
        return NextResponse.json({
          success: true,
          message: "Update completed with history",
          data: {
            updated: serializeDecimal(updated),
            history: priceHistory
          }
        });
      } catch (historyError: any) {
        console.error("Price history creation error:", historyError);
        // Even if history creation fails, the update succeeded
        return NextResponse.json({
          success: true,
          message: "Item updated but history creation failed",
          error: historyError.message,
          data: {
            updated: serializeDecimal(updated)
          }
        });
      }
    } catch (updateError: any) {
      console.error("Item update error:", updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message || "Failed to update item"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Test route error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 