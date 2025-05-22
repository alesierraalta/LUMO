import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // No auth check for testing purposes
    const body = await request.json();
    const { inventoryItemId } = body;
    
    if (!inventoryItemId) {
      return NextResponse.json({ 
        success: false, 
        error: "inventoryItemId is required" 
      }, { status: 400 });
    }
    
    // Find the inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });
    
    if (!item) {
      return NextResponse.json({ 
        success: false, 
        error: "Inventory item not found" 
      }, { status: 404 });
    }
    
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
    
    // Create a test price history record without userId
    const priceHistory = await prisma.priceHistory.create({
      data: {
        inventoryItemId,
        oldPrice: item.price,
        newPrice: item.price + 1,
        oldCost: item.cost,
        newCost: item.cost,
        oldMargin: item.margin,
        newMargin: item.margin,
        changeReason: "Test price history record - no authentication",
        // Use system user if available
        ...(systemUser ? { userId: systemUser.id } : {})
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Test price history record created without authentication",
      data: priceHistory
    });
    
  } catch (error: any) {
    console.error("Test price history error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create test price history",
      stack: error.stack
    }, { status: 500 });
  }
} 