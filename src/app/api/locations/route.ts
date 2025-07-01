import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db-supabase';

// GET /api/locations - Obtener todas las ubicaciones
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Locations functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: [],
      message: "Locations functionality temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Crear nueva ubicación
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Location creation functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Location creation functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
} 