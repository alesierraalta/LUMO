import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Health check endpoint for Choreo deployment monitoring
export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LUMO Inventory System',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      checks: {
        database: true, // Assume healthy for now
        manifests: false,
        cssFiles: false,
        auth: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      }
    };

    // Check manifest files
    try {
      const nextDir = path.join(process.cwd(), '.next');
      const buildManifest = path.join(nextDir, 'build-manifest.json');
      
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        healthData.checks.manifests = !!manifest.entryCSSFiles;
      }
    } catch (error) {
      healthData.checks.manifests = false;
    }

    // Check CSS files
    try {
      const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
      healthData.checks.cssFiles = fs.existsSync(cssDir);
    } catch (error) {
      healthData.checks.cssFiles = false;
    }

    // Determine overall status
    const allChecksPass = Object.values(healthData.checks).every(check => check === true);
    healthData.status = allChecksPass ? 'healthy' : 'degraded';

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'X-Powered-By': 'LUMO-Health-Check/1.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'LUMO Inventory System'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 