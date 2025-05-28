import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check environment configuration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      config: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrl: process.env.DATABASE_URL ? 
          (process.env.DATABASE_URL.substring(0, 20) + '...') : 'NOT_SET',
        hasClerkPublicKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        clerkPublicKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 10) + '...' : 'NOT_SET',
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        skipClerkAuth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true',
        port: process.env.PORT || '3000',
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        version: process.version
      }
    };

    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
} 