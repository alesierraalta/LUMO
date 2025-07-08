import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los permisos disponibles
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category', { ascending: true })
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Error al obtener permisos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 