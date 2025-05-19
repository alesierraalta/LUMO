import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "alesierraalta@gmail.com";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Buscar el usuario actual en nuestra base de datos
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true },
    });

    // Solo permitir a administradores sincronizar todos los usuarios
    if (!currentUser || currentUser.role.name !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener todos los roles
    const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
    const viewerRole = await prisma.role.findUnique({ where: { name: "viewer" } });

    if (!adminRole || !viewerRole) {
      return NextResponse.json({ error: "Roles requeridos no encontrados" }, { status: 404 });
    }

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      include: { role: true },
    });

    const updates = [];

    // Actualizar roles si es necesario
    for (const user of users) {
      // Si el email es el del administrador, asegurarse de que tenga rol admin
      if (user.email === ADMIN_EMAIL && user.role.name !== "admin") {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { roleId: adminRole.id },
          select: { id: true, email: true },
        });
        updates.push({ id: updated.id, email: updated.email, newRole: "admin" });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Usuarios sincronizados correctamente",
      updates: updates.length > 0 ? updates : "No se requirieron actualizaciones",
    });
  } catch (error: any) {
    console.error("Error sincronizando usuarios:", error);
    return NextResponse.json(
      { error: error.message || "Error al sincronizar usuarios" },
      { status: 500 }
    );
  }
} 