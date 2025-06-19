import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [/api/auth/supabase-me] Starting Supabase authentication check');
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [/api/auth/supabase-me] No Bearer token provided');
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ [/api/auth/supabase-me] Invalid Supabase token:', authError?.message || 'Auth session missing!');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('✅ [/api/auth/supabase-me] Supabase user authenticated:', user.email);

    // Obtener información adicional del usuario desde la tabla personalizada
    let userRole = 'USER';
    let userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    let isActive = true;

    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select(`
          name, 
          is_active, 
          roles!inner(name)
        `)
        .eq('email', user.email)
        .single();

      if (!dbError && dbUser) {
        userName = dbUser.name || userName;
        isActive = dbUser.is_active;
        userRole = (dbUser.roles as any)?.name || 'USER';
      }
    } catch (dbError) {
      console.warn('⚠️ [/api/auth/supabase-me] Could not fetch user from database:', dbError);
    }

    const responseUser = {
      id: user.id,
      email: user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    console.log('✅ [/api/auth/supabase-me] User data compiled:', responseUser.email, 'Role:', responseUser.role);
    
    return NextResponse.json({
      success: true,
      user: responseUser
    });

  } catch (error) {
    console.error('❌ [/api/auth/supabase-me] Authentication error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 