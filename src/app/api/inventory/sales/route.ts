import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db-supabase';

// Endpoint para obtener todas las ventas
export async function GET(request: NextRequest) {
  try {
    // Verificar que db está disponible
    if (!db) {
      return NextResponse.json(
        { error: "Error de conexión a la base de datos" },
        { status: 500 }
      );
    }

    // Sales functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: [],
      message: "Sales functionality temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Sales creation temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Sales creation temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 