import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "alesierraalta@gmail.com";

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

    const isAdminEmail = primaryEmail.emailAddress === ADMIN_EMAIL;

    // Find admin and viewer roles
    const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
    const viewerRole = await prisma.role.findUnique({ where: { name: "viewer" } });

    if (!adminRole || !viewerRole) {
      return NextResponse.json({ error: "Required roles not found" }, { status: 404 });
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