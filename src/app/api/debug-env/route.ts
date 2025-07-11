import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-service-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Environment Diagnostics Starting...');
    
    // Check environment variables (without exposing sensitive data)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const envCheck = {
      supabaseUrl: !!supabaseUrl,
      supabaseUrlLength: supabaseUrl?.length || 0,
      serviceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 10) || '',
    };
    
    console.log('🔍 Environment Check:', envCheck);
    
    // Test service client creation
    const serviceClient = createServiceSupabaseClient();
    const serviceClientAvailable = !!serviceClient;
    
    console.log('🔍 Service Client Available:', serviceClientAvailable);
    
    // Test database connection with service client
    let dbConnectionTest = { success: false, error: null };
    
    if (serviceClient) {
      try {
        // Try a simple query to test connection and permissions
        const { data, error } = await serviceClient
          .from('roles')
          .select('*');
        
        if (error) {
          dbConnectionTest = { success: false, error: error.message };
        } else {
          dbConnectionTest = { success: true, error: null };
        }
        
      } catch (err) {
        dbConnectionTest = { 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
      }
    }
    
    console.log('🔍 DB Connection Test:', dbConnectionTest);
    
    // Test RLS bypass capability
    let rlsBypassTest = { success: false, error: null };
    
    if (serviceClient && dbConnectionTest.success) {
      try {
        // Try to create a test role to verify RLS bypass
        const testRoleName = `TEST_ROLE_${Date.now()}`;
        const { data: createData, error: createError } = await serviceClient
          .from('roles')
          .insert({
            name: testRoleName,
            description: 'Test role for RLS bypass verification',
            is_system: false,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          rlsBypassTest = { success: false, error: createError.message };
        } else {
          // Clean up test role
          await serviceClient
            .from('roles')
            .delete()
            .eq('name', testRoleName);
          
          rlsBypassTest = { success: true, error: null };
        }
        
      } catch (err) {
        rlsBypassTest = { 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
      }
    }
    
    console.log('🔍 RLS Bypass Test:', rlsBypassTest);
    
    return NextResponse.json({
      success: true,
      diagnostics: {
        environment: envCheck,
        serviceClient: {
          available: serviceClientAvailable,
          dbConnection: dbConnectionTest,
          rlsBypass: rlsBypassTest
        },
        timestamp: new Date().toISOString(),
        recommendations: {
          envVars: !envCheck.supabaseUrl || !envCheck.serviceRoleKey ? 
            'Missing required environment variables' : 'Environment variables configured',
          serviceClient: !serviceClientAvailable ? 
            'Service client creation failed' : 'Service client created successfully',
          database: !dbConnectionTest.success ? 
            'Database connection failed - check service role key' : 'Database connection successful',
          rls: !rlsBypassTest.success ? 
            'RLS bypass failed - service role key may be incorrect' : 'RLS bypass successful'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Environment Diagnostics Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}