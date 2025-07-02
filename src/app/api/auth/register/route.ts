import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    console.log('Registration attempt for:', email);

    // Use Supabase service role client to bypass email confirmation
    const supabaseUrl = 'https://ubjujxtvlubxowsphvuk.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3Bodnd1ayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTc5NzYzODQsImV4cCI6MjAzMzU1MjM4NH0.oUP6oOOaYjRcqLEGBBHsO7CfZPKKbJJKcAJQbFKHcWU';
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 1: Create user with admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name
      }
    });

    if (authError) {
      console.error('Supabase admin auth error:', authError.message);
      return NextResponse.json(
        { success: false, error: 'Registration failed: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'User creation failed' },
        { status: 400 }
      );
    }

    console.log('Supabase admin user created:', authData.user.id);

    // Step 2: Create user record in public.users table
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use same ID as auth.users
        email: email.trim(),
        name: name,
        is_active: true,
        role_id: email.trim() === 'alesierraalta@gmail.com' ? 1 : 2 // Admin role for specific email
      })
      .select('id, email, name, is_active, role_id')
      .single();

    if (dbError) {
      console.error('Database user creation error:', dbError.message);
      // Continue even if database creation fails
    }

    // Format response
    const formattedUser = {
      id: authData.user.id,
      email: authData.user.email,
      name: name,
      role: email.trim() === 'alesierraalta@gmail.com' ? 'ADMIN' : 'USER',
      isActive: true,
      createdAt: authData.user.created_at,
    };

    console.log('User registration successful:', formattedUser);

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 