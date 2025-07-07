import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Test database connection
    const supabase = await createServerClient();
    
    // Try a simple query to test database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Health check database error:', error);
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'down',
            server: 'up'
          },
          database: {
            connected: false,
            error: error.message
          },
          error: 'Database connection failed'
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        server: 'up'
      },
      database: {
        connected: true,
        recordsFound: data?.length || 0
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          server: 'up'
        },
        database: {
          connected: false,
          error: error.message
        },
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
} 