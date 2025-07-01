import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Import history feature temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: {
        id,
        fileName: "unknown",
        status: "completed",
        totalItems: 0,
        successItems: 0,
        errorItems: 0,
        details: []
      },
      message: "Import history feature temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error fetching import history:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history" },
      { status: 500 }
    );
  }
} 