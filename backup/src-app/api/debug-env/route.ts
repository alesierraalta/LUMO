import { NextRequest, NextResponse } from "next/server";

/**
 * Environment debugging endpoint
 * Shows all available environment variables (redacted for security)
 * Use this to troubleshoot missing variables in Choreo deployment
 */
export async function GET(request: NextRequest) {
  try {
    // Get all environment variables
    const allEnvVars = process.env;
    
    // Redact sensitive values but show their presence and format
    const debugInfo = {
      // Critical Clerk variables
      clerk_variables: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
          exists: !!allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          prefix: allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) || 'MISSING',
          length: allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
          is_production: allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') || false,
          is_development: allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
        },
        CLERK_SECRET_KEY: {
          exists: !!allEnvVars.CLERK_SECRET_KEY,
          prefix: allEnvVars.CLERK_SECRET_KEY?.substring(0, 10) || 'MISSING',
          length: allEnvVars.CLERK_SECRET_KEY?.length || 0,
          is_production: allEnvVars.CLERK_SECRET_KEY?.startsWith('sk_live_') || false,
          is_development: allEnvVars.CLERK_SECRET_KEY?.startsWith('sk_test_') || false,
        },
        NEXT_PUBLIC_SKIP_CLERK_AUTH: allEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'not_set'
      },
      
      // Database variables
      database_variables: {
        DATABASE_URL: {
          exists: !!allEnvVars.DATABASE_URL,
          prefix: allEnvVars.DATABASE_URL?.substring(0, 15) || 'MISSING',
          length: allEnvVars.DATABASE_URL?.length || 0,
        },
        POSTGRES_PRISMA_URL: {
          exists: !!allEnvVars.POSTGRES_PRISMA_URL,
          prefix: allEnvVars.POSTGRES_PRISMA_URL?.substring(0, 15) || 'MISSING',
          length: allEnvVars.POSTGRES_PRISMA_URL?.length || 0,
        }
      },
      
      // Platform variables
      platform_variables: {
        NODE_ENV: allEnvVars.NODE_ENV || 'not_set',
        PORT: allEnvVars.PORT || 'not_set',
        NEXT_PUBLIC_APP_VERSION: allEnvVars.NEXT_PUBLIC_APP_VERSION || 'not_set',
        CHOREO_PROJECT: allEnvVars.CHOREO_PROJECT || 'not_set',
        GITHUB_SHA: allEnvVars.GITHUB_SHA || 'not_set'
      },
      
      // All NEXT_PUBLIC_ variables (safe to show more details)
      next_public_variables: Object.keys(allEnvVars)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .reduce((obj, key) => {
          obj[key] = {
            value: key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' 
              ? (allEnvVars[key]?.substring(0, 15) + '...') 
              : allEnvVars[key],
            length: allEnvVars[key]?.length || 0
          };
          return obj;
        }, {} as Record<string, any>),
      
      // Environment summary
      summary: {
        total_env_vars: Object.keys(allEnvVars).length,
        clerk_configured: !!(allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && allEnvVars.CLERK_SECRET_KEY),
        database_configured: !!(allEnvVars.DATABASE_URL || allEnvVars.POSTGRES_PRISMA_URL),
        is_production_env: allEnvVars.NODE_ENV === 'production',
        clerk_auth_enabled: allEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'true'
      }
    };

    // Determine overall status
    const isHealthy = debugInfo.summary.clerk_configured && debugInfo.summary.database_configured;
    const statusCode = isHealthy ? 200 : 500;

    return NextResponse.json({
      status: isHealthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      debug_info: debugInfo,
      message: isHealthy 
        ? "All critical environment variables are configured" 
        : "Missing critical environment variables - check secrets configuration"
    }, { status: statusCode });

  } catch (error) {
    console.error("Environment debug error:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Environment debugging failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 