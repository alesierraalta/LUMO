
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serializeDecimal } from "@/lib/utils";

// Validation schema for the request body
const financialsUpdateSchema = z.object({
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  margin: z.number().optional(), // Margin is calculated but stored
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = financialsUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data provided", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { price, cost, margin } = validation.data;

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

    // Update the inventory item in the database
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item financials updated successfully.",
      data: serializeDecimal(updatedItem),
    }, { status: 200 });

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