import { NextRequest, NextResponse } from 'next/server';
import { getClerkConfig } from '@/lib/clerk-config';
import logger from '@/lib/logger';

// Force Node.js runtime for logger functionality
export const runtime = 'nodejs';

// Conditional Prisma import
let prisma: any = null;
try {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    prisma = require('@/lib/db/enhanced-prisma').default;
  }
} catch (error) {
  console.warn('Prisma not available in debug endpoint');
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const hostname = request.headers.get('host') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const correlationId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Debug endpoint accessed', { correlationId }, {
    debug: {
      hostname,
      userAgent,
      timestamp: new Date().toISOString()
    }
  });

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    correlationId,
    requestInfo: {
      hostname,
      userAgent,
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    environment: {},
    clerk: {},
    database: {},
    logging: {},
    choreo: {},
    ssl: {},
    performance: {},
    connectivity: {}
  };

  // 1. ENVIRONMENT DEBUG
  try {
    debugInfo.environment = {
      nodeEnv: process.env.NODE_ENV,
      isChoreoDeployment: process.env.CHOREO_DEPLOYMENT === 'true',
      runtime: typeof process !== 'undefined' ? 'node' : 'edge',
      processInfo: typeof process !== 'undefined' ? {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      } : 'edge-runtime',
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : 'not-available',
      envVars: {
        hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        logLevel: process.env.LOG_LEVEL || 'INFO',
        enableFileLogs: process.env.ENABLE_FILE_LOGS !== 'false',
        enableConsoleLogs: process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true'
      }
    };
  } catch (error) {
    debugInfo.environment = { error: (error as Error).message };
  }

  // 2. CLERK DEBUG
  try {
    const clerkConfig = getClerkConfig();
    
    // Handle build-time scenario
    if (clerkConfig.isBuildTime) {
      debugInfo.clerk = {
        status: 'build-time',
        message: 'Clerk configuration not available during build time',
        buildTime: true
      };
    } else {
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      debugInfo.clerk = {
        config: clerkConfig,
        publishableKey: {
          exists: !!publishableKey,
          prefix: publishableKey?.substring(0, 15) + '...',
          isProduction: publishableKey?.startsWith('pk_live_'),
          isDevelopment: publishableKey?.startsWith('pk_test_')
        },
        urls: {
          problematic: `https://clerk.${hostname}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`,
          fixed: 'https://js.clerk.com/v1/clerk.js',
          domain: clerkConfig.domain,
          frontendApi: clerkConfig.frontendApi
        },
        sslFix: {
          active: clerkConfig.isChoreo,
          detectedChoreo: hostname.includes('.choreoapps.dev'),
          strategy: 'fetch-override + preload + rewrites'
        }
      };
    }
  } catch (error) {
    debugInfo.clerk = { 
      error: (error as Error).message,
      buildTimeIssue: true,
      message: 'Clerk configuration failed - this is expected during build time'
    };
  }

  // 3. DATABASE DEBUG
  if (prisma) {
    try {
      const dbHealth = await prisma.getHealth();
      debugInfo.database = {
        status: dbHealth.status,
        latency: dbHealth.latency,
        timestamp: dbHealth.timestamp,
        connection: 'available',
        enhanced: true
      };
    } catch (error) {
      debugInfo.database = {
        status: 'error',
        error: (error as Error).message,
        connection: 'failed'
      };
    }
  } else {
    debugInfo.database = {
      status: 'unavailable',
      reason: 'Prisma not loaded in this runtime',
      enhanced: false
    };
  }

  // 4. LOGGING DEBUG
  try {
    const loggerHealth = await logger.getHealth();
    debugInfo.logging = {
      health: loggerHealth,
      config: {
        transports: loggerHealth.config.transports,
        level: loggerHealth.config.level,
        runtime: loggerHealth.config.runtime
      },
      recentActivity: 'Available through logger instance'
    };
  } catch (error) {
    debugInfo.logging = { error: (error as Error).message };
  }

  // 5. CHOREO SPECIFIC DEBUG
  debugInfo.choreo = {
    detected: hostname.includes('.choreoapps.dev'),
    hostname: hostname,
    deployment: {
      id: hostname.split('.')[0] || 'unknown',
      region: hostname.includes('us-east') ? 'us-east' : 'unknown',
      environment: hostname.includes('azure') ? 'azure' : 'unknown'
    },
    ssl: {
      issue: 'Subdomain SSL certificate validation',
      solution: 'Redirect to official CDN',
      status: 'Fixed via ClerkSSLFix component'
    }
  };

  // 6. SSL & CONNECTIVITY DEBUG
  const testUrls = [
    'https://js.clerk.com/v1/clerk.js',
    'https://api.clerk.com/v1/client',
    `https://${hostname}/api/health`
  ];

  debugInfo.connectivity = {};
  for (const url of testUrls) {
    try {
      const testResponse = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      debugInfo.connectivity[url] = {
        status: testResponse.status,
        ok: testResponse.ok,
        accessible: true
      };
    } catch (error) {
      debugInfo.connectivity[url] = {
        error: (error as Error).message,
        accessible: false
      };
    }
  }

  // 7. PERFORMANCE DEBUG
  debugInfo.performance = {
    debugRequestTime: Date.now() - startTime,
    serverTimestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  // 8. SYSTEM HEALTH SUMMARY
  debugInfo.healthSummary = {
    overall: 'calculating...',
    issues: [],
    recommendations: []
  };

  // Determine overall health
  let issues = [];
  let recommendations = [];

  if (!debugInfo.clerk.publishableKey.exists) {
    issues.push('Missing Clerk publishable key');
    recommendations.push('Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
  }

  if (debugInfo.database.status === 'error') {
    issues.push('Database connection failed');
    recommendations.push('Check DATABASE_URL and database availability');
  }

  if (debugInfo.choreo.detected && !debugInfo.clerk.sslFix.active) {
    issues.push('Choreo detected but SSL fix not active');
    recommendations.push('Ensure ClerkSSLFix component is loaded');
  }

  debugInfo.healthSummary = {
    overall: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
    issues,
    recommendations,
    issueCount: issues.length
  };

  const responseTime = Date.now() - startTime;

  logger.info(`Debug endpoint completed in ${responseTime}ms`, { correlationId }, {
    debug: {
      responseTime,
      issueCount: issues.length,
      overall: debugInfo.healthSummary.overall
    }
  });

  return NextResponse.json(debugInfo, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache, no-store, must-revalidate',
      'x-correlation-id': correlationId,
      'x-debug-type': 'comprehensive',
      'x-response-time': responseTime.toString()
    }
  });
} 