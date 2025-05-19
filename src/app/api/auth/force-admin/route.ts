import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Obtener el usuario actual autenticado
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const primaryEmail = user.emailAddresses.find(
      (email: any) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail || primaryEmail.emailAddress !== "alesierraalta@gmail.com") {
      return NextResponse.json({ 
        error: "Solo el administrador puede realizar esta acción" 
      }, { status: 403 });
    }

    // Buscar el rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    if (!adminRole) {
      return NextResponse.json({ error: "Rol de administrador no encontrado" }, { status: 404 });
    }

    // Buscar el usuario en nuestra base de datos
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { role: true },
    });

    if (!dbUser) {
      // Si el usuario no existe, créalo con el rol de administrador
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: primaryEmail.emailAddress,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          roleId: adminRole.id,
        },
        include: { role: true },
      });
    } else {
      // Si el usuario existe, actualiza su rol a administrador
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { roleId: adminRole.id },
        include: { role: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Rol actualizado a administrador correctamente",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role.name,
      },
    });
  } catch (error: any) {
    console.error("Error actualizando el rol:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el rol" },
      { status: 500 }
    );
  }
} 