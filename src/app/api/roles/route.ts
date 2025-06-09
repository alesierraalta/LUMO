import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromToken, getTokenFromRequest, isAdmin } from '@/lib/auth-simple';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const currentUser = await getCurrentUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Return available roles in our simplified system
    const roles = [
      { id: 'admin', name: 'ADMIN', description: 'Full system access' },
      { id: 'manager', name: 'MANAGER', description: 'Management access' },
      { id: 'user', name: 'USER', description: 'Basic user access' }
    ];

    return NextResponse.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 