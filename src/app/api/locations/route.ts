import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET /api/locations - Obtener todas las ubicaciones
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    const locations = await prisma.location.findMany({
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
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}

// POST /api/locations - Crear nueva ubicación
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la ubicación es requerido" }, 
        { status: 400 }
      );
    }

    // Verificar si ya existe una ubicación con ese nombre
    const existingLocation = await prisma.location.findUnique({
      where: { name: name.trim() }
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: "Ya existe una ubicación con ese nombre" }, 
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
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
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
} 