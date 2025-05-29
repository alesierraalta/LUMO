import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import prisma from '@/lib/db/enhanced-prisma';
import { authLogger } from '@/lib/auth/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = request.headers.get('x-correlation-id') || 'health-check';
  
  logger.info('Advanced health check initiated', { correlationId });

  const healthData = {
    timestamp: new Date().toISOString(),
    correlationId,
    service: {
      name: 'lumo-inventory',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
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

  // 2. Database Health Check
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
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    healthData.metrics = {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        utilization: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform
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
        publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: !!process.env.CLERK_SECRET_KEY,
        configured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY
      },
      database: {
        url: !!process.env.DATABASE_URL,
        configured: !!process.env.DATABASE_URL
      },
      logging: {
        level: process.env.LOG_LEVEL || 'INFO',
        fileEnabled: process.env.ENABLE_FILE_LOGS !== 'false',
        choreoEnabled: process.env.CHOREO_DEPLOYMENT === 'true'
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
      deployment: process.env.CHOREO_DEPLOYMENT === 'true',
      serviceName: process.env.CHOREO_SERVICE_NAME || 'lumo-inventory',
      version: process.env.CHOREO_VERSION || 'unknown',
      environment: process.env.CHOREO_ENVIRONMENT || process.env.NODE_ENV,
      region: process.env.CHOREO_REGION || 'default',
      instanceId: process.env.CHOREO_INSTANCE_ID || process.env.HOSTNAME || 'local'
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
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    
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