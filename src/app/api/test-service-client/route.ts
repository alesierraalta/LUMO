import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-service-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing service client connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('📊 Environment check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'NOT SET');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }
    
    const serviceClient = createServiceSupabaseClient();
    
    if (!serviceClient) {
      return NextResponse.json({
        success: false,
        error: 'Service client creation failed'
      }, { status: 500 });
    }
    
    console.log('✅ Service client created successfully');
    
    // Test the connection by making a direct fetch to the REST API
    const headers = {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    };
    
    console.log('🔍 Testing direct REST API call...');
    const response = await fetch(`${supabaseUrl}/rest/v1/roles?select=*&order=name.asc`, {
      method: 'GET',
      headers: headers,
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API call failed:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Direct API call failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        }
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('✅ Direct API call successful:', data.length || 0, 'roles found');
    
    // Now test using the service client
    console.log('🔍 Testing service client query...');
    const result = await serviceClient
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    
    console.log('📊 Service client result:', result);
    
    return NextResponse.json({
      success: true,
      data: {
        directApiCall: {
          success: true,
          rolesCount: data.length,
          roles: data
        },
        serviceClient: {
          success: !result.error,
          error: result.error,
          rolesCount: result.data?.length || 0,
          roles: result.data || []
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}