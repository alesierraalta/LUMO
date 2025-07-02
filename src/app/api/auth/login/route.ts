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

    // Optimized Supabase authentication
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Error de autenticación' },
        { status: 401 }
      );
    }

    // Get user data from database
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, is_active, role_id, roles!role_id(name)')
      .eq('email', email.trim())
      .single();

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: userData?.name || data.user.email?.split('@')[0],
      role: userData?.roles?.name || 'USER',
      isActive: userData?.is_active ?? true,
    };

    return NextResponse.json({
      success: true,
      user,
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