import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG SUPABASE ENV VARIABLES');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndprriqyhddjoixrlqnz.supabase.co';
    
    console.log('🔧 Using Supabase URL:', supabaseUrl);
    console.log('🔑 Service key length:', supabaseServiceKey?.length || 'undefined');
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    console.log('- SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey?.length || 0);
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length || 0);
    
    // Show first/last characters for verification
    const serviceKeyPreview = supabaseServiceKey 
      ? `${supabaseServiceKey.substring(0, 10)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 10)}`
      : 'NOT_SET';
      
    const anonKeyPreview = supabaseAnonKey 
      ? `${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 10)}`
      : 'NOT_SET';
    
    return NextResponse.json({
      success: true,
      environment: 'choreo-dev',
      supabase: {
        url: supabaseUrl,
        serviceKeyExists: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey?.length || 0,
        serviceKeyPreview,
        anonKeyExists: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey?.length || 0,
        anonKeyPreview
      },
      recommendation: !supabaseServiceKey 
        ? 'SUPABASE_SERVICE_ROLE_KEY is missing - add it to Choreo environment variables'
        : 'Environment variables are configured correctly'
    });
    
  } catch (error) {
    console.error('❌ Debug env error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 