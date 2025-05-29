import { NextRequest, NextResponse } from 'next/server';
import { getClerkConfig } from '@/lib/clerk-config';

export async function GET(request: NextRequest) {
  const clerkConfig = getClerkConfig();
  const hostname = request.headers.get('host') || 'unknown';
  
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
} 