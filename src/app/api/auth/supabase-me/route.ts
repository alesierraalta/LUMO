/**
 * Supabase-Only User Verification Endpoint
 * NO JWT, NO LEGACY FALLBACKS - ONLY SUPABASE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Supabase Me] Starting Supabase-only user verification...');
    
    // Get current user using Supabase-only authentication
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ [Supabase Me] No valid Supabase session found');
      return NextResponse.json(
        { success: false, error: 'No authentication found' },
        { status: 401 }
      );
    }

    console.log(`✅ [Supabase Me] User verified: ${user.email} with role: ${user.role}`);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      }
    });

  } catch (error) {
    console.error('❌ [Supabase Me] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'User verification failed',
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