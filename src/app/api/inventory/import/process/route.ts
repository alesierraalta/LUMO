import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName } = body;
    
    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }
    
    // Import processing feature temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      message: "Import processing feature temporarily unavailable during Supabase migration",
      sessionId: `temp-session-${Date.now()}`,
      fileName
    });
    
  } catch (error) {
    console.error("Error processing import:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
} 