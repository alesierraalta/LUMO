import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db-supabase';

// GET /api/locations/[id] - Obtener ubicación específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Location functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Location functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Location update functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Location update functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Eliminar ubicación
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Location delete functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Location delete functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
} 