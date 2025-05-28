import { NextRequest, NextResponse } from 'next/server';

// API endpoint that provides a directory of all available URLs
export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;
    
    const urlDirectory = {
      status: 'success',
      service: 'LUMO Inventory System',
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      endpoints: {
        // Health and monitoring endpoints
        health: {
          description: 'Comprehensive health check with system status',
          url: `${baseUrl}/api/health`,
          method: 'GET',
          category: 'monitoring'
        },
        test: {
          description: 'Basic connectivity and server response test',
          url: `${baseUrl}/api/test`,
          method: 'GET',
          category: 'monitoring'
        },
        urls: {
          description: 'This endpoint - directory of all available URLs',
          url: `${baseUrl}/api/urls`,
          method: 'GET',
          category: 'utility'
        },
        
        // Application routes
        dashboard: {
          description: 'Main dashboard/home page',
          url: `${baseUrl}/`,
          method: 'GET',
          category: 'application'
        },
        inventory: {
          description: 'Inventory management page',
          url: `${baseUrl}/inventory`,
          method: 'GET',
          category: 'application'
        },
        products: {
          description: 'Products catalog page',
          url: `${baseUrl}/products`,
          method: 'GET',
          category: 'application'
        },
        analytics: {
          description: 'Analytics and reports page',
          url: `${baseUrl}/analytics`,
          method: 'GET',
          category: 'application'
        },
        settings: {
          description: 'Application settings page',
          url: `${baseUrl}/settings`,
          method: 'GET',
          category: 'application'
        },
        
        // API routes (add more as your application grows)
        apiBase: {
          description: 'Base API endpoint',
          url: `${baseUrl}/api`,
          method: 'GET',
          category: 'api'
        }
      },
      
      // Static resources
      static: {
        css: {
          description: 'CSS stylesheets',
          url: `${baseUrl}/_next/static/css/`,
          category: 'static'
        },
        js: {
          description: 'JavaScript bundles',
          url: `${baseUrl}/_next/static/chunks/`,
          category: 'static'
        },
        images: {
          description: 'Static images',
          url: `${baseUrl}/_next/static/media/`,
          category: 'static'
        }
      },
      
      // Development and debugging
      debug: {
        manifestStatus: {
          description: 'CSS manifest validation status',
          url: `${baseUrl}/api/manifest-status`,
          method: 'GET',
          category: 'debug'
        }
      },
      
      // Meta information
      meta: {
        totalEndpoints: 0,
        categories: ['monitoring', 'application', 'api', 'utility', 'static', 'debug'],
        version: '1.0.0',
        lastUpdated: '2025-05-28'
      }
    };
    
    // Count total endpoints
    urlDirectory.meta.totalEndpoints = Object.keys(urlDirectory.endpoints).length;
    
    return NextResponse.json(urlDirectory, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'X-Powered-By': 'LUMO-URL-Directory/1.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate URL directory',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle POST for URL validation/testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({
        status: 'error',
        message: 'URL is required for validation'
      }, { status: 400 });
    }
    
    // Basic URL validation
    try {
      new URL(url);
      
      return NextResponse.json({
        status: 'valid',
        url: url,
        message: 'URL format is valid',
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (urlError) {
      return NextResponse.json({
        status: 'invalid',
        url: url,
        message: 'Invalid URL format',
        error: urlError instanceof Error ? urlError.message : 'Unknown URL error'
      }, { status: 400 });
    }
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process URL validation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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