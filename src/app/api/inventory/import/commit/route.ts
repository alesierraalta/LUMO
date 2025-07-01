import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Import commit feature temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      message: "Import commit feature temporarily unavailable during Supabase migration",
      sessionId
    });

  } catch (error) {
    console.error("Error committing import:", error);
    return NextResponse.json(
      { error: "Failed to commit import" },
      { status: 500 }
    );
  }
} 