import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs";

export const runtime = "nodejs";

/**
 * Excel Importer Health Check Endpoint
 * 
 * This endpoint provides detailed health information about the Excel importer
 * functionality, specifically designed for Choreo monitoring.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const healthCheck = {
    timestamp: new Date().toISOString(),
    service: "excel-importer",
    status: "unknown",
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
    choreo: process.env.CHOREO_DEPLOYMENT === 'true',
    checks: {} as Record<string, any>,
    performance: {
      responseTime: 0,
      dbConnectionTime: 0
    },
    errors: [] as string[]
  };

  try {
    // 1. Database Connection Test
    const dbStartTime = Date.now();
    try {
      await db.$queryRaw`SELECT 1`;
      healthCheck.checks.database = {
        status: "healthy",
        responseTime: Date.now() - dbStartTime
      };
      healthCheck.performance.dbConnectionTime = Date.now() - dbStartTime;
    } catch (dbError) {
      healthCheck.checks.database = {
        status: "unhealthy",
        error: dbError instanceof Error ? dbError.message : String(dbError),
        responseTime: Date.now() - dbStartTime
      };
      healthCheck.errors.push(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    // 2. ImportSession Table Test
    try {
      const sessionCount = await db.importSession.count();
      healthCheck.checks.importSessionTable = {
        status: "healthy",
        recordCount: sessionCount,
        accessible: true
      };
    } catch (sessionError) {
      healthCheck.checks.importSessionTable = {
        status: "unhealthy",
        error: sessionError instanceof Error ? sessionError.message : String(sessionError),
        accessible: false
      };
      healthCheck.errors.push(`ImportSession table error: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`);
    }

    // 3. ImportSessionDetail Table Test
    try {
      const detailCount = await db.importSessionDetail.count();
      healthCheck.checks.importSessionDetailTable = {
        status: "healthy",
        recordCount: detailCount,
        accessible: true
      };
    } catch (detailError) {
      healthCheck.checks.importSessionDetailTable = {
        status: "unhealthy",
        error: detailError instanceof Error ? detailError.message : String(detailError),
        accessible: false
      };
      healthCheck.errors.push(`ImportSessionDetail table error: ${detailError instanceof Error ? detailError.message : String(detailError)}`);
    }

    // 4. File System Access Test
    try {
      const tempDirs = [
        '/tmp/lumo-import',
        '/tmp/lumo-logs',
        process.env.CHOREO_TEMP_DIR || '/tmp/lumo-temp'
      ];
      
      const dirStatus = tempDirs.map(dir => {
        try {
          const exists = fs.existsSync(dir);
          return { path: dir, exists, writable: exists };
        } catch (error) {
          return { 
            path: dir, 
            exists: false, 
            writable: false, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      });

      healthCheck.checks.fileSystem = {
        status: dirStatus.every(d => d.exists) ? "healthy" : "warning",
        directories: dirStatus
      };

      if (!dirStatus.every(d => d.exists)) {
        healthCheck.errors.push("Some required directories are missing");
      }
    } catch (fsError) {
      healthCheck.checks.fileSystem = {
        status: "unhealthy",
        error: fsError instanceof Error ? fsError.message : String(fsError)
      };
      healthCheck.errors.push(`File system access error: ${fsError instanceof Error ? fsError.message : String(fsError)}`);
    }

    // 5. Environment Variables Test
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const envStatus = requiredEnvVars.map(envVar => ({
      name: envVar,
      configured: !!process.env[envVar],
      value: process.env[envVar] ? '[CONFIGURED]' : '[MISSING]'
    }));

    healthCheck.checks.environment = {
      status: envStatus.every(env => env.configured) ? "healthy" : "warning",
      variables: envStatus
    };

    if (!envStatus.every(env => env.configured)) {
      healthCheck.errors.push("Some required environment variables are missing");
    }

    // 6. Import Service Functionality Test
    try {
      // Test if we can access the import service
      const { importService } = await import("@/lib/importService");
      
      healthCheck.checks.importService = {
        status: "healthy",
        accessible: true,
        functions: [
          'createImportSession',
          'findImportSession',
          'createImportSessionDetail'
        ]
      };
    } catch (importError) {
      healthCheck.checks.importService = {
        status: "unhealthy",
        error: importError instanceof Error ? importError.message : String(importError),
        accessible: false
      };
      healthCheck.errors.push(`Import service error: ${importError instanceof Error ? importError.message : String(importError)}`);
    }

    // 7. Check for Ready Marker (if exists)
    try {
      const markerPath = '/tmp/lumo-import-ready';
      if (fs.existsSync(markerPath)) {
        const markerContent = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
        healthCheck.checks.readyMarker = {
          status: "healthy",
          exists: true,
          content: markerContent
        };
      } else {
        healthCheck.checks.readyMarker = {
          status: "warning",
          exists: false,
          message: "Ready marker not found - startup script may not have run"
        };
      }
    } catch (markerError) {
      healthCheck.checks.readyMarker = {
        status: "warning",
        error: markerError instanceof Error ? markerError.message : String(markerError)
      };
    }

    // Determine overall status
    const hasErrors = healthCheck.errors.length > 0;
    const criticalChecks = ['database', 'importSessionTable', 'importSessionDetailTable'];
    const criticalFailures = criticalChecks.some(check => 
      healthCheck.checks[check]?.status === 'unhealthy'
    );

    if (criticalFailures) {
      healthCheck.status = "unhealthy";
    } else if (hasErrors) {
      healthCheck.status = "degraded";
    } else {
      healthCheck.status = "healthy";
    }

    // Calculate response time
    healthCheck.performance.responseTime = Date.now() - startTime;

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === "healthy" ? 200 : 
                      healthCheck.status === "degraded" ? 200 : 503;

    return NextResponse.json(healthCheck, { status: httpStatus });

  } catch (error) {
    healthCheck.status = "unhealthy";
    healthCheck.errors.push(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
    healthCheck.performance.responseTime = Date.now() - startTime;

    return NextResponse.json(healthCheck, { status: 503 });
  } finally {
    // Ensure Prisma connection is closed
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors in health check
    }
  }
} 