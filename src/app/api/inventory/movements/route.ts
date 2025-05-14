import { NextRequest, NextResponse } from "next/server";
import { getAllStockMovements } from "@/services/inventoryService";
import { ensureValidDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    
    // Handle date filters
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    const startDate = startDateParam ? ensureValidDate(startDateParam) : undefined;
    const endDate = endDateParam ? ensureValidDate(endDateParam) : undefined;
    
    // Get movements with filters
    const result = await getAllStockMovements({
      type: type as any,
      limit,
      page,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error processing inventory movements request:", error);
    return NextResponse.json(
      { error: error.message || "Error retrieving inventory movements" },
      { status: 500 }
    );
  }
} 