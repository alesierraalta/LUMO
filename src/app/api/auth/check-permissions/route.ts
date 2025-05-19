import { NextRequest, NextResponse } from "next/server";
import { hasPermission, hasRole } from "@/lib/auth";
import { UserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, permission } = body;
    
    let authorized = false;
    
    // Check role if provided
    if (role) {
      authorized = await hasRole(role as UserRole);
    }
    
    // Check permission if provided and not already authorized by role
    if (!authorized && permission) {
      authorized = await hasPermission(permission);
    }
    
    // If neither role nor permission provided, consider authorized
    if (!role && !permission) {
      authorized = true;
    }
    
    return NextResponse.json({ authorized });
  } catch (error) {
    console.error("Error checking permissions:", error);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
} 