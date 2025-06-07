/**
 * PRISMA P6001 FIX INTEGRATION
 * 
 * This module integrates the P6001 fix with the Automated Debug Log System.
 * It provides:
 * - Diagnostic logging for Prisma connection issues
 * - Automatic detection of P6001 errors
 * - Self-healing capabilities for common database URL issues
 * - Integration with deployment health monitoring
 */

import { choreoLogger } from '../choreo-debug-logger';

// Use existing logger instance
const logger = choreoLogger;

/**
 * Diagnose and fix Prisma P6001 errors
 */
export async function diagnoseAndFixP6001() {
  logger.info('PRISMA_FIX', 'Starting P6001 diagnostics');
  logger.startPerformanceTimer('p6001-diagnosis');
  
  // 1. Check DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL || '';
  let urlFixed = false;
  
  logger.info('PRISMA_FIX', 'Checking DATABASE_URL format', {
    urlPrefix: databaseUrl.slice(0, 15) + '...'
  });
  
  if (databaseUrl.startsWith('prisma://')) {
    logger.warn('PRISMA_FIX', 'Found prisma:// protocol, converting to postgresql://', {
      issue: 'invalid-protocol',
      severity: 'high',
      autoFixed: true
    });
    
    // Fix the URL
    process.env.DATABASE_URL = databaseUrl.replace('prisma://', 'postgresql://');
    urlFixed = true;
  } else if (databaseUrl.startsWith('postgres://')) {
    logger.warn('PRISMA_FIX', 'Found postgres:// protocol, converting to postgresql://', {
      issue: 'legacy-protocol',
      severity: 'medium',
      autoFixed: true
    });
    
    // Fix the URL
    process.env.DATABASE_URL = databaseUrl.replace('postgres://', 'postgresql://');
    urlFixed = true;
  }
  
  // 2. Check schema.prisma configuration
  try {
    const schemaPath = './prisma/schema.prisma';
    const schemaContent = await import('fs').then(fs => 
      fs.promises.readFile(schemaPath, 'utf8')
    );
    
    // Check for proper provider configuration
    if (!schemaContent.includes('provider = "postgresql"')) {
      logger.error('PRISMA_FIX', 'schema.prisma is not configured for PostgreSQL', {
        issue: 'invalid-provider',
        severity: 'high',
        autoFixed: false
      });
    }
    
    // Check for binary targets
    if (!schemaContent.includes('binaryTargets = ')) {
      logger.error('PRISMA_FIX', 'Missing binary targets in schema.prisma', {
        issue: 'missing-binary-targets',
        severity: 'high',
        autoFixed: false,
        recommendation: 'Add binaryTargets = ["native", "debian-openssl-3.0.x"] to generator section'
      });
    } else if (!schemaContent.includes('debian-openssl-3.0.x')) {
      logger.error('PRISMA_FIX', 'Missing Choreo binary target in schema.prisma', {
        issue: 'incomplete-binary-targets',
        severity: 'high',
        autoFixed: false,
        recommendation: 'Ensure binaryTargets includes "debian-openssl-3.0.x"'
      });
    }
  } catch (error) {
    logger.error('PRISMA_FIX', 'Failed to analyze schema.prisma', {
      error: error.message
    });
  }
  
  // 3. Verify fix effectiveness
  try {
    const { PrismaClient } = require('@prisma/client');
    const testClient = new PrismaClient();
    await testClient.$connect();
    
    logger.info('PRISMA_FIX', 'Successfully connected to database', {
      success: true
    });
    
    await testClient.$disconnect();
  } catch (error) {
    logger.error('PRISMA_FIX', 'Failed to connect to database after fixes', {
      error: error.message,
      code: error.code || 'unknown',
      recommendation: error.code === 'P6001' 
        ? 'Database URL protocol still incorrect, check DATABASE_URL value' 
        : 'Connection failed for other reasons, check database credentials and availability'
    });
  }
  
  logger.endPerformanceTimer('p6001-diagnosis');
  return urlFixed;
}

/**
 * Register with health monitoring system
 */
export function registerWithHealthSystem() {
  return {
    name: 'prisma-p6001-fix',
    status: 'active',
    description: 'Fixes Prisma P6001 connection issues',
    lastRun: new Date().toISOString(),
    autoFix: true,
    targetIssues: ['P6001', 'database-connection', 'prisma-url']
  };
}
