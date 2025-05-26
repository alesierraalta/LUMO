import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Lista de correos electrónicos que siempre tendrán rol de administrador
// Esto se puede modificar para agregar más administradores según sea necesario
const ADMIN_EMAILS = [
  "alesierraalta@gmail.com",
  // Agrega más correos electrónicos de administradores aquí
];

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const primaryEmail = user.emailAddresses.find(
      (email: any) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return NextResponse.json({ error: "User has no primary email" }, { status: 400 });
    }

    const isAdminEmail = ADMIN_EMAILS.includes(primaryEmail.emailAddress);
    console.log(`Sync user: ${primaryEmail.emailAddress}, isAdmin: ${isAdminEmail}`);

    // Find admin and viewer roles
    const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
    const viewerRole = await prisma.role.findUnique({ where: { name: "viewer" } });

    if (!adminRole || !viewerRole) {
      console.error("Required roles not found in database. Creating them now...");
      
      // Si no existen los roles, créalos
      if (!adminRole) {
        await prisma.role.create({
          data: {
            name: 'admin',
            description: 'Acceso completo a todas las funcionalidades',
          }
        });
      }
      
      if (!viewerRole) {
        await prisma.role.create({
          data: {
            name: 'viewer',
            description: 'Acceso de solo lectura a la aplicación',
          }
        });
      }
      
      return NextResponse.json({ 
        error: "Roles were missing and have been created. Please try again." 
      }, { status: 503 });
    }

    // Check if the user already exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        role: true,
      },
    });

    // If user exists
    if (dbUser) {
      // If this is the admin email but doesn't have admin role, update it
      if (isAdminEmail && dbUser.role.name !== 'admin') {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { roleId: adminRole.id },
          include: { role: true },
        });
        
        console.log(`Updated ${primaryEmail.emailAddress} to admin role`);
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role.name,
        },
      });
    }

    // User doesn't exist, so create them with appropriate role
    // Admin email gets admin role, others get viewer role
    const roleId = isAdminEmail ? adminRole.id : viewerRole.id;
    const roleName = isAdminEmail ? 'admin' : 'viewer';
    
    console.log(`Creating new user ${primaryEmail.emailAddress} with role ${roleName}`);

    // Create the user in our database
    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        roleId: roleId,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role.name,
      },
    });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync user" },
      { status: 500 }
    );
  }
} 