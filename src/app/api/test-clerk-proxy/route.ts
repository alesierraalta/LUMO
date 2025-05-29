export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-CLERK-PROXY] 🔍 Testing Clerk proxy functionality...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // Test 1: Basic clerk.js proxy
    try {
      const baseUrl = new URL(request.url).origin;
      const clerkJsUrl = `${baseUrl}/api/clerk-proxy/v1/clerk.js`;
      
      console.log('[TEST-CLERK-PROXY] Testing URL:', clerkJsUrl);
      
      const response = await fetch(clerkJsUrl, {
        headers: {
          'User-Agent': 'LUMO-Test-Agent/1.0',
        },
      });
      
      testResults.tests.push({
        name: 'Basic clerk.js proxy',
        url: clerkJsUrl,
        status: response.status,
        success: response.ok,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        corsHeaders: {
          allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
          allowMethods: response.headers.get('Access-Control-Allow-Methods'),
        },
      });
      
      testResults.summary.total++;
      if (response.ok) testResults.summary.passed++;
      else testResults.summary.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Basic clerk.js proxy',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 2: clerk.browser.js proxy (the problematic one)
    try {
      const baseUrl = new URL(request.url).origin;
      const browserJsUrl = `${baseUrl}/api/clerk-proxy/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
      
      console.log('[TEST-CLERK-PROXY] Testing URL:', browserJsUrl);
      
      const response = await fetch(browserJsUrl, {
        headers: {
          'User-Agent': 'LUMO-Test-Agent/1.0',
        },
      });
      
      testResults.tests.push({
        name: 'clerk.browser.js proxy',
        url: browserJsUrl,
        status: response.status,
        success: response.ok,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        corsHeaders: {
          allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
          allowMethods: response.headers.get('Access-Control-Allow-Methods'),
        },
      });
      
      testResults.summary.total++;
      if (response.ok) testResults.summary.passed++;
      else testResults.summary.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'clerk.browser.js proxy',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 3: Direct Clerk.com connection (should fail in Choreo)
    try {
      const directUrl = 'https://js.clerk.com/v1/clerk.js';
      
      console.log('[TEST-CLERK-PROXY] Testing direct URL:', directUrl);
      
      const response = await fetch(directUrl, {
        headers: {
          'User-Agent': 'LUMO-Test-Agent/1.0',
        },
      });
      
      testResults.tests.push({
        name: 'Direct clerk.com connection',
        url: directUrl,
        status: response.status,
        success: response.ok,
        note: 'This might fail in Choreo due to SSL issues',
      });
      
      testResults.summary.total++;
      if (response.ok) testResults.summary.passed++;
      else testResults.summary.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Direct clerk.com connection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Expected to fail in Choreo - this is why we need the proxy',
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    console.log('[TEST-CLERK-PROXY] ✅ Test completed');
    console.log('[TEST-CLERK-PROXY] Results:', JSON.stringify(testResults, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Clerk proxy test completed',
      results: testResults,
      environment: {
        hostname: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
        isChoreo: request.headers.get('host')?.includes('.choreoapps.dev') || false,
      },
    });

  } catch (error) {
    console.error('[TEST-CLERK-PROXY] ❌ Test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'Use GET method to run tests' },
    { status: 405 }
  );
} 