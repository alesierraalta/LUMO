import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Try to get auth directly
    let authInfo: { userId: string | null; sessionClaims: any | null } = { 
      userId: null, 
      sessionClaims: null 
    };
    
    try {
      const authResult = await auth();
      authInfo = {
        userId: authResult.userId,
        sessionClaims: authResult.sessionClaims
      };
    } catch (authError) {
      console.error("Auth error:", authError);
    }
    
    // Try to get current user
    let currentUserData = null;
    try {
      const user = await currentUser();
      currentUserData = user ? {
        id: user.id,
        emailAddresses: user.emailAddresses,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryEmailId: user.primaryEmailAddressId
      } : null;
    } catch (userError) {
      console.error("Current user error:", userError);
    }
    
    // Check environment
    const envInfo = {
      hasClerkPublicKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY
    };
    
    return NextResponse.json({
      auth: authInfo,
      currentUser: currentUserData,
      environment: envInfo,
      message: "Auth debugging complete"
    });
  } catch (error: any) {
    console.error("Auth debug error:", error);
    return NextResponse.json(
      { error: error.message || "Auth debug error" },
      { status: 500 }
    );
  }
} 