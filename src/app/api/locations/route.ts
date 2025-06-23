import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken, getTokenFromRequest } from "@/lib/auth-server";
import db from "@/lib/db";

// GET /api/locations - Obtener todas las ubicaciones
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    let user = null;
    
    if (token) {
      user = await getCurrentUserFromToken(token);
    }
    
    // Fallback to default user if no token or user found
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const locations = await db.location.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: "asc"
      },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    return NextResponse.json(locations);
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
    const token = getTokenFromRequest(request);
    let user = null;
    
    if (token) {
      user = await getCurrentUserFromToken(token);
    }
    
    // Fallback to default user if no token or user found
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una ubicación con ese nombre
    const existingLocation = await db.location.findUnique({
      where: { name: name.trim() }
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: "Ya existe una ubicación con ese nombre" }, 
        { status: 400 }
      );
    }

    const location = await db.location.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
} 