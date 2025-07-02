import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-singleton';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    console.log('Login attempt for:', email.trim());

    // Optimized Supabase authentication
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error('Supabase auth error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      console.error('No user or session returned from Supabase');
      return NextResponse.json(
        { success: false, error: 'Error de autenticación' },
        { status: 401 }
      );
    }

    console.log('Supabase auth successful for:', data.user.email);

    // Get user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, is_active, role_id, roles!role_id(name)')
      .eq('email', email.trim())
      .single();

    if (dbError) {
      console.error('Database error:', dbError.message);
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: userData?.name || data.user.email?.split('@')[0],
      role: userData?.roles?.name || 'USER',
      isActive: userData?.is_active ?? true,
    };

    console.log('Login successful for user:', user);

    // CRITICAL FIX: Return the JWT token for authentication
    return NextResponse.json({
      success: true,
      user,
      token: data.session.access_token, // Add JWT token
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 