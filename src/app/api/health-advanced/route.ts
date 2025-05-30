import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import logger from '@/lib/logger';
import { authLogger } from '@/lib/auth/logger';

// Force Node.js runtime for logger functionality
export const runtime = 'nodejs';

const prisma = new PrismaClient();

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      external: number;
      rss: number;
    };
    pid: number;
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  database: {
    connected: boolean;
    responseTime: number;
    url: string;
    error?: string;
  };
  env: {
    nodeEnv: string | undefined;
    port: string;
    hostname: string;
    envVars: {
      hasDatabase: boolean;
      hasJwtSecret: boolean;
    };
  };
  auth: {
    type: string;
    jwtSecretConfigured: boolean;
    configured: boolean;
  };
  deployment: {
    type: string;
    standalone: boolean;
    buildTime: string;
    gitCommit: string;
  };
  warnings?: string[];
  responseTime?: number;
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Health check data
    const healthData: HealthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'lumo-inventory',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System metrics
      system: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        },
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },

      // Database connectivity
      database: {
        connected: false,
        responseTime: 0,
        url: process.env.DATABASE_URL ? 'configured' : 'missing'
      },

      // Environment check
      env: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || '3000',
        hostname: process.env.HOSTNAME || 'localhost',
        envVars: {
          hasDatabase: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET,
        }
      },

      // Authentication system
      auth: {
        type: 'custom-jwt',
        jwtSecretConfigured: typeof process !== 'undefined' ? !!process.env.JWT_SECRET : false,
        configured: typeof process !== 'undefined' ? !!process.env.JWT_SECRET : false
      },

      // Deployment info
      deployment: {
        type: 'choreo',
        standalone: true,
        buildTime: process.env.BUILD_TIME || 'unknown',
        gitCommit: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      }
    };

    // Test database connectivity
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthData.database.connected = true;
      healthData.database.responseTime = Date.now() - dbStart;
    } catch (dbError) {
      healthData.database.connected = false;
      healthData.database.error = dbError instanceof Error ? dbError.message : 'Database connection failed';
    }

    // Check for warnings
    const warnings = [];
    
    if (!process.env.DATABASE_URL) {
      warnings.push('DATABASE_URL not configured');
    }
    
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET not configured');
    }

    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET should be set in production');
    }

    if (warnings.length > 0) {
      healthData.warnings = warnings;
    }

    // Response time
    healthData.responseTime = Date.now() - start;

    // Determine overall status
    let status = 'healthy';
    
    if (!healthData.database.connected) {
      status = 'degraded';
    }
    
    if (!healthData.auth.configured) {
      status = 'unhealthy';
    }

    healthData.status = status;

    return NextResponse.json(healthData, {
      status: status === 'healthy' ? 200 : status === 'degraded' ? 206 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'lumo-inventory'
      }
    });

  } catch (error) {
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lumo-inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function checkClerkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
  try {
    // Basic configuration check
    const hasPublishableKey = typeof process !== 'undefined' ? 
      !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY : false;
    const hasSecretKey = typeof process !== 'undefined' ? 
      !!process.env.CLERK_SECRET_KEY : false;
    
    if (!hasPublishableKey || !hasSecretKey) {
      return {
        status: 'unhealthy',
        details: {
          publishableKey: hasPublishableKey,
          secretKey: hasSecretKey,
          reason: 'Missing required Clerk configuration'
        }
      };
    }

    // TODO: Add actual Clerk API health check if needed
    // For now, just verify configuration exists
    return {
      status: 'healthy',
      details: {
        publishableKey: hasPublishableKey,
        secretKey: hasSecretKey,
        configured: true
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: (error as Error).message
      }
    };
  }
} 