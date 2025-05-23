import { NextRequest, NextResponse } from "next/server";
import { getAllStockMovements } from "@/services/inventoryService";
import { ensureValidDate } from "@/lib/utils";
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";

export async function GET(request: NextRequest) {
  try {
    // Verificar permisos antes de devolver datos
    const authCheck = await checkPermissionsWithDebug("admin");
    
    // Si el usuario no está autorizado, devolver datos vacíos
    if (!authCheck.authorized) {
      return NextResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        pages: 0
      });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || undefined;
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
    
    // Get movements with filters
    const result = await getAllStockMovements({
      type: type !== "all" ? type as any : undefined,
      limit,
      page,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      categoryId,
      search,
      sort
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