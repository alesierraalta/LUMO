import { NextResponse } from 'next/server';

/**
 * PRODUCTION ENVIRONMENT DIAGNOSTIC ENDPOINT
 * This endpoint can be deployed to Vercel to diagnose production environment issues
 */
export async function GET() {
  try {
    // Safely extract environment info without exposing secrets
    const diagnosticInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
        ENVIRONMENT_NAME: process.env.ENVIRONMENT_NAME,
      },
      supabase: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        projectId: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', ''),
      },
      auth: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        jwtSecretPreview: process.env.JWT_SECRET?.substring(0, 20) + '...',
      },
      database: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...',
      },
      timestamp: new Date().toISOString(),
      deployment: {
        vercelRegion: process.env.VERCEL_REGION,
        vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
        vercelBuildTime: process.env.VERCEL_BUILD_TIME,
      }
    };

    // Check for common production issues
    const issues = [];
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      issues.push('MISSING: NEXT_PUBLIC_SUPABASE_URL');
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      issues.push('MISSING: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      issues.push('MISSING: SUPABASE_SERVICE_ROLE_KEY');
    }
    
    if (!process.env.JWT_SECRET) {
      issues.push('MISSING: JWT_SECRET');
    }
    
    if (process.env.JWT_SECRET?.startsWith('DEV_')) {
      issues.push('WARNING: JWT_SECRET has DEV_ prefix in production');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      issues.push('WARNING: NODE_ENV is not set to production');
    }

    // Check if development and production are using different Supabase projects
    const devProjectId = 'ndprriqyhddjoixrlqnz'; // From .env.local
    const currentProjectId = diagnosticInfo.supabase.projectId;
    
    if (currentProjectId === devProjectId) {
      issues.push('WARNING: Production is using development Supabase project');
    }

    return NextResponse.json({
      status: 'success',
      message: 'Production environment diagnostic complete',
      diagnostics: diagnosticInfo,
      issues,
      recommendations: [
        'Verify all environment variables are set in Vercel dashboard',
        'Ensure production uses production Supabase project, not development',
        'Check that JWT_SECRET matches between environments for shared authentication',
        'Verify CORS settings allow requests from production domain',
        'Ensure users authenticate to the correct environment'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to generate production diagnostic',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}