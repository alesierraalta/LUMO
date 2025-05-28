import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for debugging server issues
export async function GET(request: NextRequest) {
  const testData = {
    status: 'server-responding',
    message: 'LUMO Inventory System Test Endpoint',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET',
    userAgent: request.headers.get('user-agent'),
    httpVersion: '1.1', // Next.js uses HTTP/1.1
    server: 'Next.js 15.3.1',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform
  };

  return NextResponse.json(testData, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'X-Test-Response': 'true'
    }
  });
}

// Handle POST for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    return NextResponse.json({
      status: 'post-received',
      body: body,
      timestamp: new Date().toISOString(),
      contentType: request.headers.get('content-type')
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'POST request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 