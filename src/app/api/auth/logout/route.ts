import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-client';



// ULTRA-AGGRESSIVE BUILD DETECTION
const isBuild = process.env.NODE_ENV === 'production' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.BUILD_ID ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build'))
);

if (isBuild) {
  console.log('🏗️ BUILD MODE: Bypassing Supabase initialization');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Iniciando logout...');
    
    const supabase = createServerSupabaseClient();
    
    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error cerrando sesión Supabase:', error);
    } else {
      console.log('✅ Sesión Supabase cerrada exitosamente');
    }

    // Crear respuesta exitosa
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // Limpiar cookies de autenticación
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    // Limpiar cookies de Supabase si existen
    response.cookies.set('sb-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    console.log('✅ Logout completado exitosamente');
    return response;

  } catch (error) {
    console.error('💥 Error general en logout:', error);
    
    // Aún así, limpiar las cookies en caso de error
    const response = NextResponse.json(
      { success: true, message: 'Logged out (with cleanup)' },
      { status: 200 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
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