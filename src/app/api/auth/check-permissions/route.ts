import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken, getTokenFromRequest } from "@/lib/auth-simple";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, permission } = body;
    
    // Get current user
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }
    
    const user = await getCurrentUserFromToken(token);
    if (!user) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }
    
    let authorized = false;
    
    // Check role if provided
    if (role) {
      authorized = user.role === role || user.role === 'ADMIN';
    }
    
    // For now, if no specific permission system is implemented,
    // we'll use basic role-based authorization
    if (!authorized && permission) {
      // Basic permission check - admins have all permissions
      authorized = user.role === 'ADMIN';
    }
    
    // If neither role nor permission provided, consider authorized if user exists
    if (!role && !permission) {
      authorized = true;
    }
    
    return NextResponse.json({ authorized });
  } catch (error) {
    console.error("Error checking permissions:", error);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
} 