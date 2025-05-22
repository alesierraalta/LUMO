import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    // Check permission (optional, implement as needed)
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    // Fetch price history records for the inventory item
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        inventoryItemId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(priceHistory);
  } catch (error: any) {
    console.error("Error fetching price history:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch price history",
        details: error.message 
      },
      { status: 500 }
    );
  }
} 