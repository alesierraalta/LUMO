import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest, isAdmin } from '@/lib/auth-server';
import { supabaseServer } from '@/lib/supabase-server-only';
import db from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db as supabaseDb } from '@/lib/db-supabase';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Helper function to get current user from either Supabase or legacy JWT
async function getCurrentUser(request: NextRequest) {
  // Try Supabase authentication first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Initialize Supabase client
              const supabase = supabaseServer;
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        // Get user data from our database
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          include: { role: true }
        });
        
        if (dbUser && dbUser.isActive) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role?.name || 'USER',
            isActive: dbUser.isActive,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
        }
      }
    } catch (supabaseError) {
      console.log('Supabase auth failed, trying legacy JWT...');
    }
  }
  
  // Fallback to legacy JWT authentication
  const token = getTokenFromRequest(request);
  if (token) {
    return await getCurrentUserFromToken(token);
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // User creation functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "User creation functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Users functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: [],
      message: "Users functionality temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 