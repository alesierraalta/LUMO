import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and MANAGER can view permissions
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all permissions from the permissions table
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error) {
      console.error('❌ Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('❌ Permissions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 