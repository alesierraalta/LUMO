import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "alesierraalta@gmail.com";

export async function GET(request: NextRequest) {
  try {
    // Check if admin role exists
    const adminRole = await prisma.role.findUnique({ 
      where: { name: "admin" } 
    });
    
    if (!adminRole) {
      return NextResponse.json({
        success: false,
        error: "Admin role not found"
      }, { status: 404 });
    }
    
    // Find or create a dummy admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
      include: { role: true }
    });
    
    if (adminUser) {
      if (adminUser.role.name !== "admin") {
        // Update to admin role if not already
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: "Admin user found and verified",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: "admin"
        }
      });
    } else {
      // Create a dummy admin user
      const newAdminUser = await prisma.user.create({
        data: {
          clerkId: "dummy_clerk_id_for_testing",
          email: ADMIN_EMAIL,
          firstName: "Admin",
          lastName: "User",
          roleId: adminRole.id
        },
        include: { role: true }
      });
      
      return NextResponse.json({
        success: true,
        message: "Admin user created",
        user: {
          id: newAdminUser.id,
          email: newAdminUser.email,
          role: "admin"
        }
      });
    }
  } catch (error: any) {
    console.error("Force admin error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to force admin"
    }, { status: 500 });
  }
} 