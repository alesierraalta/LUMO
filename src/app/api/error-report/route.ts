import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime for logger functionality
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || 'error-report';
  try {
    const errorReport = await request.json();
    const {
      error,
      context,
      timestamp,
      url,
      userAgent,
      viewport
    } = errorReport;
    // Log the client-side error with comprehensive context
    logger.error('Client-side error reported', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.digest && { digest: error.digest })
    }, {
      correlationId: context?.correlationId || correlationId,
      userAgent,
      ipAddress: getClientIP(request)
    }, {
      clientError: {
        timestamp,
        url,
        viewport,
        context,
        reportedAt: new Date().toISOString(),
        severity: calculateSeverity(error),
        category: categorizeError(error)
      }
    });
    // Log security event for potential security-related errors
    if (isSecurityRelated(error)) {
      logger.logSecurity({
        event: 'client_side_security_error',
        severity: 'medium',
        details: {
          errorType: error.name,
          errorMessage: error.message,
          url,
          userAgent,
          timestamp
        }
      }, {
        correlationId: context?.correlationId || correlationId
      });
    }
    // Log performance issue for performance-related errors
    if (isPerformanceRelated(error)) {
      logger.logPerformance({
        duration: context?.errorDuration || 0,
        webVitals: {
          lcp: viewport?.lcp,
          fid: viewport?.fid,
          cls: viewport?.cls
        }
      }, {
        correlationId: context?.correlationId || correlationId
      });
    }
    return NextResponse.json({
      success: true,
      correlationId: context?.correlationId || correlationId,
      timestamp: new Date().toISOString(),
      message: 'Error report received and logged'
    });
  } catch (error) {
    logger.error('Failed to process error report', error as Error, { correlationId });
    return NextResponse.json({
      success: false,
      error: 'Failed to process error report',
      correlationId
    }, { status: 500 });
  }
}
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return 'unknown';
}
function calculateSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  if (error.message?.includes('database') || error.message?.includes('ECONNREFUSED')) {
    return 'critical';
  }
  if (error.message?.includes('entryCSSFiles') || error.message?.includes('auth')) {
    return 'high';
  }
  if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
    return 'medium';
  }
  return 'low';
}
function categorizeError(error: any): string {
  if (error.message?.includes('entryCSSFiles') || error.message?.includes('CSS')) {
    return 'css_manifest_error';
  }
  if (error.message?.includes('auth') || error.message?.includes()) {
    return 'authentication_error';
  }
  if (error.message?.includes('database') || error.message?.includes('Prisma')) {
    return 'database_error';
  }
  if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
    return 'chunk_load_error';
  }
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return 'network_error';
  }
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'javascript_error';
  }
  return 'unknown_error';
}
function isSecurityRelated(error: any): boolean {
  const securityKeywords = [
    'unauthorized', 'forbidden', 'csrf', 'xss', 'injection',
    'auth', 'permission', 'token', 'session'
  ];
  const errorString = (error.message + ' ' + error.name).toLowerCase();
  return securityKeywords.some(keyword => errorString.includes(keyword));
}
function isPerformanceRelated(error: any): boolean {
  const performanceKeywords = [
    'timeout', 'slow', 'memory', 'chunk', 'loading',
    'network', 'latency', 'performance'
  ];
  const errorString = (error.message + ' ' + error.name).toLowerCase();
  return performanceKeywords.some(keyword => errorString.includes(keyword));
}