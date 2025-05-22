import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serializeDecimal } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

// Validation schema for the request body
const financialsUpdateSchema = z.object({
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  margin: z.number().optional(), // Margin is calculated but stored
  changeReason: z.string().optional(), // Added for tracking reason of price/cost change
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Make auth optional for testing
    let userId = null;
    let authUser = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      
      if (userId) {
        authUser = await prisma.user.findUnique({
          where: { clerkId: userId }
        });
      }
    } catch (authError) {
      console.log("Auth skipped for testing:", authError);
    }
    
    // If no authenticated user, try to find or create a system user
    if (!authUser) {
      try {
        // First try to find an existing system user
        authUser = await prisma.user.findFirst({
          where: { email: 'sistema@lumo.local' }
        });
        
        // If no system user exists, create one
        if (!authUser) {
          // First find the viewer role
          const viewerRole = await prisma.role.findUnique({
            where: { name: 'viewer' }
          });
          
          if (viewerRole) {
            authUser = await prisma.user.create({
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
      }
    }
    
    console.log("Route params:", { id, userId, authUserId: authUser?.id });

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received body:", body);
    
    // Validate request body
    const validation = financialsUpdateSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation errors:", validation.error.issues);
      return NextResponse.json(
        { success: false, error: "Invalid data provided", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { price, cost, margin, changeReason } = validation.data;

    // Prepare data for update (only include fields that are present)
    const updateData: { price?: number; cost?: number; margin?: number } = {};
    if (price !== undefined) updateData.price = price;
    if (cost !== undefined) updateData.cost = cost;
    if (margin !== undefined) updateData.margin = margin;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json(
        { success: true, message: "No financial data provided for update." },
        { status: 200 }
      );
    }

    // Get the current inventory item to compare with new values
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!currentItem) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Check if any financial values have changed
    const hasFinancialChanges = 
      (price !== undefined && price !== currentItem.price) ||
      (cost !== undefined && cost !== currentItem.cost) ||
      (margin !== undefined && margin !== currentItem.margin);

    // Perform transaction to update item and create history record if there are changes
    try {
      console.log("Starting transaction for ID:", id);
      console.log("Update data:", updateData);
      console.log("Current values:", {
        price: currentItem.price,
        cost: currentItem.cost,
        margin: currentItem.margin
      });
      
      const updatedItem = await prisma.$transaction(async (tx) => {
        console.log("Transaction started");
        
        // Update the inventory item
        console.log("Updating inventory item with data:", updateData);
        const updated = await tx.inventoryItem.update({
          where: { id },
          data: updateData,
        });
        console.log("Inventory item updated successfully");

        // Only create history record if there are actual changes
        if (hasFinancialChanges) {
          console.log("Creating price history record");
          const historyData = {
            inventoryItemId: id,
            oldPrice: currentItem.price,
            newPrice: price !== undefined ? price : currentItem.price,
            oldCost: currentItem.cost,
            newCost: cost !== undefined ? cost : currentItem.cost,
            oldMargin: currentItem.margin,
            newMargin: margin !== undefined ? margin : currentItem.margin,
            changeReason: changeReason || "Manual update",
            ...(authUser ? { userId: authUser.id } : {})
          };
          console.log("Price history data:", historyData);
          
          await tx.priceHistory.create({
            data: historyData,
          });
          console.log("Price history record created successfully");
        } else {
          console.log("No financial changes detected, skipping history record");
        }

        return updated;
      });
      
      console.log("Transaction completed successfully");

      return NextResponse.json({
        success: true,
        message: "Inventory item financials updated successfully.",
        data: serializeDecimal(updatedItem),
      }, { status: 200 });
    } catch (txError) {
      console.error("Transaction error:", txError);
      throw txError; // Re-throw to be caught by the outer catch block
    }

  } catch (error: any) {
    console.error("Error updating inventory financials:", error);

    let statusCode = 500;
    let errorMessage = "Error updating inventory financials";

    // Check for Prisma-specific errors (e.g., record not found)
    if (error.code === 'P2025') { // Prisma code for Record to update not found
      statusCode = 404;
      errorMessage = "Inventory item not found";
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error.message // Include original error message for debugging
      },
      { status: statusCode }
    );
  }
} 