import { NextRequest, NextResponse } from "next/server";

/**
 * Simple health check endpoint to verify application status
 * Returns basic status without complex checks that might fail during deployment
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Basic environment checks
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      hasClerkKeys: !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
      skipAuth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    };

    // Simple status
    const healthResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        server: true,
        environment: env,
      }
    };

    return NextResponse.json(healthResult, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[HEALTH] Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      version: process.env.npm_package_version || '0.1.0'
    }, { 
      status: 500 
    });
  }
} 