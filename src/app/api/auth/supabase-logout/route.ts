/**
 * Supabase-Only Logout Endpoint
 * NO JWT, NO LEGACY FALLBACKS - ONLY SUPABASE
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server-only';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Supabase Logout] Starting Supabase-only logout...');
    
    // Use Supabase authentication
    const supabase = supabaseServer;
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(`❌ [Supabase Logout] Logout failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: 'Logout failed' },
        { status: 500 }
      );
    }

    console.log('✅ [Supabase Logout] Logout successful');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase logout successful'
    });

  } catch (error) {
    console.error('❌ [Supabase Logout] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 