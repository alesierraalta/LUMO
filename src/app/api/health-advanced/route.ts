import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { authLogger } from '@/lib/auth/logger';

// Conditional Prisma import for Node.js environment only
let prisma: any = null;
try {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    prisma = require('@/lib/db/enhanced-prisma').default;
  }
} catch (error) {
  console.warn('Prisma not available in this environment:', error);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = request.headers.get('x-correlation-id') || 'health-check';
  
  logger.info('Advanced health check initiated', { correlationId });

  const healthData = {
    timestamp: new Date().toISOString(),
    correlationId,
    service: {
      name: 'lumo-inventory',
      version: typeof process !== 'undefined' ? (process.env.npm_package_version || '1.0.0') : '1.0.0',
      environment: typeof process !== 'undefined' ? (process.env.NODE_ENV || 'development') : 'edge',
      uptime: typeof process !== 'undefined' ? process.uptime() : 0
    },
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    checks: {} as Record<string, any>,
    metrics: {} as Record<string, any>,
    dependencies: {} as Record<string, any>
  };

  // 1. Logger Health Check
  try {
    const loggerHealth = await logger.getHealth();
    healthData.checks.logger = {
      status: loggerHealth.status,
      responseTime: Date.now() - startTime,
      details: loggerHealth
    };
  } catch (error) {
    healthData.checks.logger = {
      status: 'unhealthy',
      error: (error as Error).message
    };
    healthData.status = 'degraded';
  }

  // 2. Database Health Check (only if Prisma is available)
  if (prisma) {
    try {
      const dbHealth = await prisma.getHealth();
      healthData.checks.database = {
        status: dbHealth.status,
        latency: dbHealth.latency,
        details: dbHealth
      };
      
      if (dbHealth.status === 'unhealthy') {
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.checks.database = {
        status: 'unhealthy',
        error: (error as Error).message
      };
      healthData.status = 'unhealthy';
    }
  } else {
    healthData.checks.database = {
      status: 'skipped',
      reason: 'Prisma not available in this runtime environment'
    };
  }

  // 3. Authentication Health Check
  try {
    const authStats = authLogger.getFailedAttemptStats();
    const clerkStatus = await checkClerkHealth();
    
    healthData.checks.authentication = {
      status: clerkStatus.status,
      failedAttempts: authStats,
      clerk: clerkStatus
    };
    
    if (authStats.activeThreats > 10) {
      healthData.status = 'degraded';
      logger.warn('High number of active security threats detected', { correlationId }, {
        security: {
          activeThreats: authStats.activeThreats,
          totalIPs: authStats.totalIPs
        }
      });
    }
  } catch (error) {
    healthData.checks.authentication = {
      status: 'unhealthy',
      error: (error as Error).message
    };
    healthData.status = 'degraded';
  }

  // 4. System Metrics
  try {
    let memoryUsage: any = {};
    let cpuUsage: any = {};
    
    if (typeof process !== 'undefined') {
      memoryUsage = process.memoryUsage();
      cpuUsage = process.cpuUsage();
    }
    
    healthData.metrics = {
      memory: {
        used: memoryUsage.heapUsed || 0,
        total: memoryUsage.heapTotal || 0,
        external: memoryUsage.external || 0,
        rss: memoryUsage.rss || 0,
        utilization: memoryUsage.heapTotal ? (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100 : 0
      },
      cpu: {
        user: cpuUsage.user || 0,
        system: cpuUsage.system || 0
      },
      process: {
        pid: typeof process !== 'undefined' ? process.pid : 0,
        uptime: typeof process !== 'undefined' ? process.uptime() : 0,
        version: typeof process !== 'undefined' ? process.version : 'edge',
        platform: typeof process !== 'undefined' ? process.platform : 'edge'
      }
    };

    // Check if memory usage is critical
    if (healthData.metrics.memory.utilization > 90) {
      healthData.status = 'degraded';
      logger.warn('High memory utilization detected', { correlationId }, {
        performance: {
          memoryUtilization: healthData.metrics.memory.utilization,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal
        }
      });
    }
  } catch (error) {
    healthData.checks.systemMetrics = {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }

  // 5. Environment Dependencies
  try {
    healthData.dependencies = {
      clerk: {
        publishableKey: typeof process !== 'undefined' ? !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY : false,
        secretKey: typeof process !== 'undefined' ? !!process.env.CLERK_SECRET_KEY : false,
        configured: typeof process !== 'undefined' ? (!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY) : false
      },
      database: {
        url: typeof process !== 'undefined' ? !!process.env.DATABASE_URL : false,
        configured: typeof process !== 'undefined' ? !!process.env.DATABASE_URL : false
      },
      logging: {
        level: typeof process !== 'undefined' ? (process.env.LOG_LEVEL || 'INFO') : 'INFO',
        fileEnabled: typeof process !== 'undefined' ? (process.env.ENABLE_FILE_LOGS !== 'false') : false,
        choreoEnabled: typeof process !== 'undefined' ? (process.env.CHOREO_DEPLOYMENT === 'true') : false
      }
    };

    // Check critical dependencies
    if (!healthData.dependencies.clerk.configured) {
      healthData.status = 'unhealthy';
      logger.error('Clerk authentication not properly configured', undefined, { correlationId });
    }

    if (!healthData.dependencies.database.configured) {
      healthData.status = 'unhealthy';
      logger.error('Database not properly configured', undefined, { correlationId });
    }
  } catch (error) {
    healthData.checks.dependencies = {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }

  // 6. Choreo-specific Health
  try {
    healthData.checks.choreo = {
      deployment: typeof process !== 'undefined' ? (process.env.CHOREO_DEPLOYMENT === 'true') : false,
      serviceName: typeof process !== 'undefined' ? (process.env.CHOREO_SERVICE_NAME || 'lumo-inventory') : 'lumo-inventory',
      version: typeof process !== 'undefined' ? (process.env.CHOREO_VERSION || 'unknown') : 'unknown',
      environment: typeof process !== 'undefined' ? (process.env.CHOREO_ENVIRONMENT || process.env.NODE_ENV) : 'edge',
      region: typeof process !== 'undefined' ? (process.env.CHOREO_REGION || 'default') : 'default',
      instanceId: typeof process !== 'undefined' ? (process.env.CHOREO_INSTANCE_ID || process.env.HOSTNAME || 'local') : 'edge'
    };
  } catch (error) {
    healthData.checks.choreo = {
      status: 'degraded',
      error: (error as Error).message
    };
  }

  const totalResponseTime = Date.now() - startTime;
  healthData.metrics.responseTime = totalResponseTime;

  // Log health check completion
  logger.info(`Advanced health check completed in ${totalResponseTime}ms`, { correlationId }, {
    health: {
      status: healthData.status,
      responseTime: totalResponseTime,
      checksPerformed: Object.keys(healthData.checks).length
    }
  });

  // Return appropriate HTTP status
  let httpStatus = 200;
  if (healthData.status === 'degraded') {
    httpStatus = 200; // Still functional but with issues
  } else if (healthData.status === 'unhealthy') {
    httpStatus = 503; // Service unavailable
  }

  return NextResponse.json(healthData, { 
    status: httpStatus,
    headers: {
      'x-correlation-id': correlationId,
      'x-health-status': healthData.status,
      'cache-control': 'no-cache, no-store, must-revalidate'
    }
  });
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