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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    const [endpoint, ...restPath] = pathSegments;
    
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
    
    console.log('[CLERK-PROXY] 🔄 Proxying GET request to:', finalUrl);
    
    // Make the request to Clerk
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LUMO-Choreo-Proxy/1.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error('[CLERK-PROXY] ❌ Upstream error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Upstream error', status: response.status },
        { status: response.status }
      );
    }
    
    // Get the content
    const contentType = response.headers.get('content-type') || '';
    
    let content: string | ArrayBuffer;
    if (contentType.includes('application/javascript') || contentType.includes('text/')) {
      content = await response.text();
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
    
    // Add CORS headers for client access
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Add cache headers for JavaScript files
    if (contentType.includes('javascript')) {
      proxyResponse.headers.set('Cache-Control', 'public, max-age=3600');
    }
    
    return proxyResponse;
    
  } catch (error) {
    console.error('[CLERK-PROXY] ❌ Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    const [endpoint, ...restPath] = pathSegments;
    
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
    },
  });
} 