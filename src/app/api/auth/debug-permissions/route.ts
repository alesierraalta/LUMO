import { NextRequest, NextResponse } from "next/server";
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";
import { UserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;
    
    const result = await checkPermissionsWithDebug(role as UserRole);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error en debug-permissions:", error);
    return NextResponse.json({
      authorized: false,
      debugInfo: { error: error.message || "Error desconocido" }
    }, { status: 500 });
  }
} 