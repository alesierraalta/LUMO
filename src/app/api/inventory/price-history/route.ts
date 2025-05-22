import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Check permission (optional, implement as needed)
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "date-desc";

    // Build where clause
    const where: any = {};
    
    // Handle date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    // Handle category filtering
    if (categoryId && categoryId !== "all") {
      where.inventoryItem = {
        categoryId
      };
    }
    
    // Handle search query (search by product name or SKU)
    if (search) {
      where.OR = [
        {
          inventoryItem: {
            name: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        },
        {
          inventoryItem: {
            sku: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        }
      ];
    }

    // Determine sort order
    let orderBy: any = {};
    
    switch (sort) {
      case "date-asc":
        orderBy = { createdAt: "asc" };
        break;
      case "date-desc":
        orderBy = { createdAt: "desc" };
        break;
      case "product-asc":
        orderBy = { inventoryItem: { name: "asc" } };
        break;
      case "product-desc":
        orderBy = { inventoryItem: { name: "desc" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Fetch price history with filtering and sorting
    const priceHistory = await prisma.priceHistory.findMany({
      where,
      orderBy,
      include: {
        inventoryItem: {
          select: {
            name: true,
            sku: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 100, // Limit to 100 records at a time
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