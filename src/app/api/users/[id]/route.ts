import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken, getTokenFromRequest } from "@/lib/auth-simple";
import db from "@/lib/db";
import { hashPassword } from "@/lib/auth-simple";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [/api/users/[id]] Starting user fetch...');
    
    // Get token from request
    const token = getTokenFromRequest(request);
    console.log('🔍 [/api/users/[id]] Token found:', !!token);
    
    if (!token) {
      console.log('❌ [/api/users/[id]] No token provided');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current user from token
    const currentUser = await getCurrentUserFromToken(token);
    console.log('🔍 [/api/users/[id]] Current user:', currentUser ? currentUser.email : 'Not found');
    
    if (!currentUser) {
      console.log('❌ [/api/users/[id]] Authentication failed');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      console.log('❌ [/api/users/[id]] User not admin:', currentUser.role);
      return NextResponse.json(
        { error: "Unauthorized: Only admins can view user details" },
        { status: 403 }
      );
    }

    if (!db) {
      console.log('❌ [/api/users/[id]] Database not available');
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    console.log('🔍 [/api/users/[id]] Looking for user ID:', userId);

    // Get the user with role information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      },
    });

    console.log('🔍 [/api/users/[id]] User found:', !!user);

    if (!user) {
      console.log('❌ [/api/users/[id]] User not found:', userId);
      return NextResponse.json(
        { error: `User with ID ${userId} not found` },
        { status: 404 }
      );
    }

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.name, // Map name to firstName for compatibility
      lastName: '',
      roleId: user.roleId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log('✅ [/api/users/[id]] User data prepared successfully');
    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error("❌ [/api/users/[id]] Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [/api/users/[id]] Starting user update...');
    
    // Get token from request
    const token = getTokenFromRequest(request);
    console.log('🔍 [/api/users/[id]] Token found:', !!token);
    
    if (!token) {
      console.log('❌ [/api/users/[id]] No token provided');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current user from token
    const currentUser = await getCurrentUserFromToken(token);
    console.log('🔍 [/api/users/[id]] Current user:', currentUser ? currentUser.email : 'Not found');
    
    if (!currentUser) {
      console.log('❌ [/api/users/[id]] Authentication failed');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      console.log('❌ [/api/users/[id]] User not admin:', currentUser.role);
      return NextResponse.json(
        { error: "Unauthorized: Only admins can update users" },
        { status: 403 }
      );
    }

    if (!db) {
      console.log('❌ [/api/users/[id]] Database not available');
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    console.log('🔍 [/api/users/[id]] Updating user ID:', userId);

    // Get the request body
    const body = await request.json();
    const { firstName, lastName, roleId, isActive, password, customPermissions } = body;
    console.log('🔍 [/api/users/[id]] Update data:', { firstName, roleId, isActive, hasPassword: !!password });

    // Check if the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log('❌ [/api/users/[id]] User not found for update:', userId);
      return NextResponse.json(
        { error: `User with ID ${userId} not found` },
        { status: 404 }
      );
    }

    // Validate role if provided
    if (roleId) {
      const role = await db.role.findUnique({
        where: { id: roleId },
      });
      if (!role) {
        console.log('❌ [/api/users/[id]] Role not found:', roleId);
        return NextResponse.json(
          { error: `Role with ID ${roleId} not found` },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.name = firstName;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        console.log('❌ [/api/users/[id]] Password too short');
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(password);
    }

    console.log('🔍 [/api/users/[id]] Executing update...');
    
    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true
      },
    });

    // Return updated user data
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      firstName: updatedUser.name,
      lastName: '',
      roleId: updatedUser.roleId,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    console.log('✅ [/api/users/[id]] User updated successfully');
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: userData,
    });
  } catch (error: any) {
    console.error("❌ [/api/users/[id]] Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [/api/users/[id]] Starting user deletion...');
    
    // Get token from request
    const token = getTokenFromRequest(request);
    console.log('🔍 [/api/users/[id]] Token found:', !!token);
    
    if (!token) {
      console.log('❌ [/api/users/[id]] No token provided');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current user from token
    const currentUser = await getCurrentUserFromToken(token);
    console.log('🔍 [/api/users/[id]] Current user:', currentUser ? currentUser.email : 'Not found');
    
    if (!currentUser) {
      console.log('❌ [/api/users/[id]] Authentication failed');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      console.log('❌ [/api/users/[id]] User not admin:', currentUser.role);
      return NextResponse.json(
        { error: "Unauthorized: Only admins can delete users" },
        { status: 403 }
      );
    }

    if (!db) {
      console.log('❌ [/api/users/[id]] Database not available');
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    console.log('🔍 [/api/users/[id]] Deleting user ID:', userId);

    // Check if the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log('❌ [/api/users/[id]] User not found for deletion:', userId);
      return NextResponse.json(
        { error: `User with ID ${userId} not found` },
        { status: 404 }
      );
    }

    // Prevent deletion of the current user
    if (userId === currentUser.id) {
      console.log('❌ [/api/users/[id]] Cannot delete self');
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    console.log('🔍 [/api/users/[id]] Executing deletion...');
    
    // Delete the user
    await db.user.delete({
      where: { id: userId },
    });

    console.log('✅ [/api/users/[id]] User deleted successfully');
    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ [/api/users/[id]] Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
} 