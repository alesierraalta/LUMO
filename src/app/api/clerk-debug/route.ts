import { NextRequest, NextResponse } from 'next/server';
import { getClerkConfig } from '@/lib/clerk-config';

// Force Node.js runtime for full functionality
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Clerk Debug Endpoint Active',
      environment: {
        is_choreo: process.env.NODE_ENV === 'production',
        clerk_key_present: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        clerk_secret_present: !!process.env.CLERK_SECRET_KEY,
        skip_auth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true'
      },
      instructions: {
        test_mock_clerk: 'Visit /sign-in to test the mock Clerk fallback',
        check_auth_state: 'Open browser console to see authentication debug logs',
        force_fallback: 'Mock Clerk will activate automatically in Choreo environment'
      },
      debug_info: {
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        endpoint: '/api/clerk-debug'
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Clerk-Debug': 'active'
      }
    });

  } catch (error: any) {
    console.error('❌ Clerk debug endpoint error:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Debug endpoint failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'test_auth') {
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Authentication test successful',
        mock_user: {
          id: 'choreo-demo-user',
          email: 'demo@choreo.test',
          firstName: 'Demo',
          lastName: 'User',
          created: new Date().toISOString()
        },
        session: {
          id: 'choreo-demo-session',
          status: 'active',
          created: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid action. Available actions: test_auth',
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET_OLD(request: NextRequest) {
  try {
    const clerkConfig = getClerkConfig();
    const hostname = request.headers.get('host') || 'unknown';
    
    // Handle build-time scenario
    if (clerkConfig.isBuildTime) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        status: 'build-time',
        message: 'This endpoint is being called during build time. Environment variables may not be available.',
        hostname,
        buildTimeInfo: {
          nodeEnv: process.env.NODE_ENV,
          availableEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
          notice: 'This is expected during the build process'
        }
      }, {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache, no-store, must-revalidate',
          'x-debug-info': 'build-time-execution'
        }
      });
    }
    
    // Get the problematic URL that's causing SSL issues
    const problematicUrl = `https://clerk.${hostname}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    const fixedUrl = 'https://js.clerk.com/v1/clerk.js';
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hostname,
      clerkConfig: {
        publishableKeyExists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
        isChoreo: clerkConfig.isChoreo,
        domain: clerkConfig.domain,
        frontendApi: clerkConfig.frontendApi
      },
      urls: {
        problematic: problematicUrl,
        fixed: fixedUrl,
        explanation: 'The problematic URL tries to load Clerk JS from a subdomain that lacks proper SSL certificates'
      },
      solution: {
        approach: 'Redirect all Clerk JS requests to the official CDN',
        implementation: 'ClerkSSLFix component + Next.js rewrites + fetch override',
        status: 'Active'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isChoreoDeployment: process.env.CHOREO_DEPLOYMENT === 'true',
        runtime: typeof process !== 'undefined' ? 'node' : 'edge'
      }
    };
    
    // Test if we can reach the fixed URL
    try {
      const testResponse = await fetch(fixedUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      debugInfo.connectivityTest = {
        fixedUrl,
        status: testResponse.status,
        statusText: testResponse.statusText,
        accessible: testResponse.ok
      };
    } catch (error) {
      debugInfo.connectivityTest = {
        fixedUrl,
        error: (error as Error).message,
        accessible: false
      };
    }
    
    return NextResponse.json(debugInfo, {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, must-revalidate',
        'x-debug-info': 'clerk-ssl-certificate-issue'
      }
    });
  } catch (error) {
    // Handle any errors during execution
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: (error as Error).message,
      message: 'Error during clerk-debug execution',
      stack: (error as Error).stack
    }, {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, must-revalidate',
        'x-debug-info': 'error-response'
      }
    });
  }
} 