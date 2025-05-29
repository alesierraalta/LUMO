export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Map of proxy paths to actual Clerk URLs
const CLERK_ENDPOINTS = {
  'v1': 'https://js.clerk.com/v1',
  'npm': 'https://js.clerk.com/npm',
  'api': 'https://api.clerk.com',
  'accounts': 'https://accounts.clerk.com',
};

// Default fallback for common Clerk files
const FALLBACK_ENDPOINTS = {
  'clerk.js': 'https://js.clerk.com/v1/clerk.js',
  'clerk.browser.js': 'https://js.clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    const [endpoint, ...restPath] = pathSegments;
    
    console.log('[CLERK-PROXY] 📥 GET Request received:', {
      endpoint,
      restPath,
      fullPath: pathSegments.join('/'),
      url: request.url
    });
    
    // Determine the target URL
    let baseUrl = CLERK_ENDPOINTS[endpoint as keyof typeof CLERK_ENDPOINTS];
    let targetPath = restPath.join('/');
    let finalTargetUrl = '';
    
    if (baseUrl) {
      finalTargetUrl = `${baseUrl}/${targetPath}`;
    } else {
      // Try fallback for common files
      const fileName = pathSegments[pathSegments.length - 1];
      if (FALLBACK_ENDPOINTS[fileName as keyof typeof FALLBACK_ENDPOINTS]) {
        finalTargetUrl = FALLBACK_ENDPOINTS[fileName as keyof typeof FALLBACK_ENDPOINTS];
        console.log('[CLERK-PROXY] 🔄 Using fallback URL for:', fileName, '->', finalTargetUrl);
      } else {
        // Default fallback - assume it's a clerk.js request
        finalTargetUrl = 'https://js.clerk.com/v1/clerk.js';
        console.log('[CLERK-PROXY] 🔄 Using default fallback:', finalTargetUrl);
      }
    }
    
    // Forward query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const finalUrl = searchParams ? `${finalTargetUrl}?${searchParams}` : finalTargetUrl;
    
    console.log('[CLERK-PROXY] 🔄 Proxying GET request to:', finalUrl);
    
    // Make the request to Clerk with enhanced headers
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LUMO-Choreo-Proxy/1.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'script',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });
    
    if (!response.ok) {
      console.error('[CLERK-PROXY] ❌ Upstream error:', response.status, response.statusText);
      console.error('[CLERK-PROXY] ❌ URL that failed:', finalUrl);
      
      // Try alternative URL if the primary fails
      if (finalUrl.includes('clerk.browser.js')) {
        const altUrl = 'https://js.clerk.com/v1/clerk.js';
        console.log('[CLERK-PROXY] 🔄 Trying alternative URL:', altUrl);
        
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'LUMO-Choreo-Proxy/1.0',
            'Accept': '*/*',
          },
        });
        
        if (altResponse.ok) {
          const content = await altResponse.text();
          return new NextResponse(content, {
            status: 200,
            headers: {
              'Content-Type': 'application/javascript',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Upstream error', status: response.status, url: finalUrl },
        { status: response.status }
      );
    }
    
    // Get the content
    const contentType = response.headers.get('content-type') || '';
    
    let content: string | ArrayBuffer;
    if (contentType.includes('application/javascript') || contentType.includes('text/') || finalUrl.includes('.js')) {
      content = await response.text();
      
      // Modify JavaScript content to prevent subdomain issues
      if (typeof content === 'string' && content.includes('clerk')) {
        content = content.replace(
          /https:\/\/clerk\.[^\/]+\.choreoapps\.dev/g,
          `${new URL(request.url).origin}/api/clerk-proxy/npm`
        );
        console.log('[CLERK-PROXY] 🔧 Modified JS content to use proxy URLs');
      }
    } else {
      content = await response.arrayBuffer();
    }
    
    console.log('[CLERK-PROXY] ✅ Successfully proxied request');
    
    // Create the response with appropriate headers
    const proxyResponse = new NextResponse(content, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy relevant headers from the original response
    const headersToKeep = [
      'content-type',
      'cache-control',
      'expires',
      'last-modified',
      'etag',
    ];
    
    headersToKeep.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        proxyResponse.headers.set(header, value);
      }
    });
    
    // Force JavaScript content type for .js files
    if (finalUrl.includes('.js') || content.toString().includes('function')) {
      proxyResponse.headers.set('content-type', 'application/javascript; charset=utf-8');
    }
    
    // Add CORS headers for client access
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add cache headers for JavaScript files
    if (contentType.includes('javascript') || finalUrl.includes('.js')) {
      proxyResponse.headers.set('Cache-Control', 'public, max-age=3600');
    }
    
    return proxyResponse;
    
  } catch (error) {
    console.error('[CLERK-PROXY] ❌ Proxy error:', error);
    console.error('[CLERK-PROXY] ❌ Request details:', {
      url: request.url,
      path: params.path,
    });
    
    // Return a basic Clerk stub as emergency fallback
    const stubScript = `
      console.log('[CLERK-PROXY] Emergency stub loaded');
      if (!window.Clerk) {
        window.Clerk = {
          version: 'proxy-stub-1.0.0',
          load: () => Promise.resolve(),
          isReady: () => false,
          loaded: false,
        };
      }
    `;
    
    return new NextResponse(stubScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    const [endpoint, ...restPath] = pathSegments;
    
    console.log('[CLERK-PROXY] 📥 POST Request received:', {
      endpoint,
      restPath,
      fullPath: pathSegments.join('/'),
    });
    
    // Determine the target URL
    const baseUrl = CLERK_ENDPOINTS[endpoint as keyof typeof CLERK_ENDPOINTS];
    if (!baseUrl) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
    
    const targetPath = restPath.join('/');
    const targetUrl = `${baseUrl}/${targetPath}`;
    
    // Forward query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const finalUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;
    
    console.log('[CLERK-PROXY] 🔄 Proxying POST request to:', finalUrl);
    
    // Get the request body
    const body = await request.text();
    
    // Make the request to Clerk
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': 'LUMO-Choreo-Proxy/1.0',
        'Accept': '*/*',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: body || undefined,
    });
    
    if (!response.ok) {
      console.error('[CLERK-PROXY] ❌ Upstream POST error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Upstream error', status: response.status },
        { status: response.status }
      );
    }
    
    // Get the response content
    const responseText = await response.text();
    
    console.log('[CLERK-PROXY] ✅ Successfully proxied POST request');
    
    // Create the response
    const proxyResponse = new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy content-type header
    const contentType = response.headers.get('content-type');
    if (contentType) {
      proxyResponse.headers.set('content-type', contentType);
    }
    
    // Add CORS headers
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return proxyResponse;
    
  } catch (error) {
    console.error('[CLERK-PROXY] ❌ POST proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
} 