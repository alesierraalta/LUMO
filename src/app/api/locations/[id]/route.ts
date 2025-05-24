import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET /api/locations/[id] - Obtener ubicación específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}

// PUT /api/locations/[id] - Actualizar ubicación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    const { name, description, isActive } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la ubicación es requerido" }, 
        { status: 400 }
      );
    }

    // Verificar si existe otra ubicación con el mismo nombre
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: "Ya existe otra ubicación con ese nombre" }, 
        { status: 400 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive ?? true,
      },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Eliminar ubicación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    // Verificar si la ubicación existe
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" }, 
        { status: 404 }
      );
    }

    // Verificar si hay productos usando esta ubicación
    if (location._count.inventory > 0) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar la ubicación porque tiene ${location._count.inventory} producto(s) asignado(s)` 
        }, 
        { status: 400 }
      );
    }

    await prisma.location.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Ubicación eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
} 