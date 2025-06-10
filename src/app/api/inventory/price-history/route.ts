import { NextRequest, NextResponse } from "next/server";
import { ensureValidDate } from "@/lib/utils";
import db from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      // Return empty array for unauthorized users
      return NextResponse.json([]);
    }
    
    // Ensure prisma is available
    if (!prisma) {
      console.error("Database connection not available");
      return NextResponse.json([]);
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "date-desc";
    
    // Handle date filters
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    const startDate = startDateParam ? ensureValidDate(startDateParam) : undefined;
    const endDate = endDateParam ? ensureValidDate(endDateParam) : undefined;
    
    // Build query conditions
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Category filtering
    if (categoryId && categoryId !== "all") {
      where.inventoryItem = {
        categoryId
      };
    }

    // Search functionality
    if (search) {
      where.OR = [
        {
          inventoryItem: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          inventoryItem: {
            sku: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          changeReason: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Define the sort order
    const orderBy: any = {};
    
    switch (sort) {
      case 'date-asc':
        orderBy.createdAt = 'asc';
        break;
      case 'product-asc':
        orderBy.inventoryItem = {
          name: 'asc'
        };
        break;
      case 'product-desc':
        orderBy.inventoryItem = {
          name: 'desc'
        };
        break;
      case 'date-desc':
      default:
        orderBy.createdAt = 'desc';
        break;
    }
    
    // Fetch price history data safely
    try {
      const priceHistory = await db.priceHistory.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              id: true,
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
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      });
      
      // Ensure we always return an array
      return NextResponse.json(Array.isArray(priceHistory) ? priceHistory : []);
    } catch (dbError) {
      console.error("Database error fetching price history:", dbError);
      // Return empty array in case of database error
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("Error processing price history request:", error);
    // Return empty array instead of error status to prevent client-side errors
    return NextResponse.json([]);
  }
} 