import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Health check endpoint to verify application status
 * Returns basic environment configuration status (without exposing secrets)
 */

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    server: boolean;
    database: boolean;
    manifests: boolean;
    css: boolean;
    authentication: boolean;
  };
  details: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    manifests: any;
    css: any;
    environment: string;
  };
  errors: string[];
  warnings: string[];
}

async function checkManifests(): Promise<{ valid: boolean; details: any; errors: string[] }> {
  const errors: string[] = [];
  const details: any = {};
  
  try {
    const nextDir = path.join(process.cwd(), '.next');
    const manifests = [
      { path: path.join(nextDir, 'build-manifest.json'), name: 'build-manifest' },
      { path: path.join(nextDir, 'app-build-manifest.json'), name: 'app-build-manifest' }
    ];

    for (const { path: manifestPath, name } of manifests) {
      try {
        const content = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(content);
        
        details[name] = {
          exists: true,
          hasEntryCSSFiles: !!manifest.entryCSSFiles,
          entryCSSFilesType: typeof manifest.entryCSSFiles,
          pagesCount: manifest.pages ? Object.keys(manifest.pages).length : 0
        };

        if (!manifest.entryCSSFiles) {
          errors.push(`${name}: Missing entryCSSFiles property`);
        }
      } catch (error) {
        errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        details[name] = { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return {
      valid: errors.length === 0,
      details,
      errors
    };
  } catch (error) {
    errors.push(`Manifest check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, details: {}, errors };
  }
}

async function checkCSS(): Promise<{ valid: boolean; details: any; errors: string[] }> {
  const errors: string[] = [];
  const details: any = {};
  
  try {
    const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
    
    try {
      const files = await fs.readdir(cssDir);
      details.cssDirectory = {
        exists: true,
        filesCount: files.length,
        files: files.filter(f => f.endsWith('.css'))
      };
    } catch (error) {
      errors.push(`CSS directory not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
      details.cssDirectory = { exists: false };
    }

    // Check for required CSS files
    const requiredCSSFiles = ['app.css', 'globals.css', 'fallback.css'];
    for (const cssFile of requiredCSSFiles) {
      const cssPath = path.join(cssDir, cssFile);
      try {
        await fs.access(cssPath);
        details[cssFile] = { exists: true };
      } catch {
        details[cssFile] = { exists: false };
        // Not necessarily an error as these might be optional
      }
    }

    return {
      valid: errors.length === 0,
      details,
      errors
    };
  } catch (error) {
    errors.push(`CSS check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, details: {}, errors };
  }
}

async function checkAuthentication(): Promise<{ valid: boolean; details: any; errors: string[] }> {
  const errors: string[] = [];
  const details: any = {};
  
  try {
    details.clerkPublishableKey = {
      exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...' || 'none'
    };
    
    details.clerkSecretKey = {
      exists: !!process.env.CLERK_SECRET_KEY
    };
    
    details.skipAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';

    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !details.skipAuth) {
      errors.push('Clerk publishable key missing and auth not skipped');
    }

    if (!process.env.CLERK_SECRET_KEY && !details.skipAuth) {
      errors.push('Clerk secret key missing and auth not skipped');
    }

    return {
      valid: errors.length === 0,
      details,
      errors
    };
  } catch (error) {
    errors.push(`Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, details: {}, errors };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Run all health checks
    const [manifestCheck, cssCheck, authCheck] = await Promise.all([
      checkManifests(),
      checkCSS(),
      checkAuthentication()
    ]);

    // Aggregate errors and warnings
    errors.push(...manifestCheck.errors);
    errors.push(...cssCheck.errors);
    errors.push(...authCheck.errors);

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (errors.length > 0) {
      // Check if errors are critical
      const criticalErrors = errors.filter(error => 
        error.includes('entryCSSFiles') || 
        error.includes('Manifest check failed') ||
        error.includes('Authentication check failed')
      );
      
      status = criticalErrors.length > 0 ? 'unhealthy' : 'degraded';
    }

    const healthResult: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        server: true, // If we're responding, server is running
        database: true, // TODO: Add actual database health check
        manifests: manifestCheck.valid,
        css: cssCheck.valid,
        authentication: authCheck.valid
      },
      details: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        manifests: manifestCheck.details,
        css: cssCheck.details,
        environment: process.env.NODE_ENV || 'unknown'
      },
      errors,
      warnings
    };

    const responseTime = Date.now() - startTime;
    
    // Log health check result
    console.log(`[HEALTH-CHECK] Status: ${status}, Response time: ${responseTime}ms, Errors: ${errors.length}`);

    return NextResponse.json(healthResult, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('[HEALTH-CHECK] Fatal error during health check:', error);
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
    timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        server: false,
        database: false,
        manifests: false,
        css: false,
        authentication: false
      },
      details: {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
        manifests: {},
        css: {},
        environment: process.env.NODE_ENV || 'unknown'
      },
      errors: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };

    return NextResponse.json(errorResult, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 