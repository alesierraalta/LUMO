import { NextRequest, NextResponse } from "next/server";
import { getAllStockMovements } from "@/services/inventoryService";
import { ensureValidDate } from "@/lib/utils";
import db from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// Disable static generation for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
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
    try {
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
      
      // Mapear el formato de respuesta para que sea consistente con lo que espera el cliente
      return NextResponse.json({
        data: result.movements || [],
        movements: result.movements || [], // Mantener ambos formatos para compatibilidad
        pagination: result.pagination || {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    } catch (error) {
      console.error("Error processing inventory movements data:", error);
      // En caso de error, devolver un array vacío para evitar errores en el cliente
      return NextResponse.json({
        data: [],
        movements: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0
        }
      });
    }
  } catch (error: any) {
    console.error("Error processing inventory movements request:", error);
    return NextResponse.json(
      { 
        error: error.message || "Error retrieving inventory movements",
        data: [],
        movements: []
      },
      { status: 500 }
    );
  }
} 