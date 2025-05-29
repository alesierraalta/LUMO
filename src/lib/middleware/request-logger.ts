import { NextRequest, NextResponse } from 'next/server';
import { APILogInfo } from '../logger/types';

// Conditional logger import for Edge Runtime compatibility
let logger: any = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  logAPI: () => {}
};

let LogFormatter: any = {
  generateCorrelationId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};

try {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const loggerModule = require('../logger');
    const formatterModule = require('../logger/formatters');
    logger = loggerModule.default;
    LogFormatter = formatterModule.LogFormatter;
  }
} catch (error) {
  console.warn('Logger not available in this runtime environment');
}

export interface RequestContext {
  correlationId: string;
  startTime: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

// Store request contexts using correlation ID
const requestContexts = new Map<string, RequestContext>();

export function createRequestLogger() {
  return {
    logRequest: (request: NextRequest): RequestContext => {
      const correlationId = LogFormatter.generateCorrelationId();
      const startTime = Date.now();
      
      // Extract user context if available
      const userId = request.headers.get('x-user-id') || undefined;
      const sessionId = request.headers.get('x-session-id') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;
      const ipAddress = hashIP(getClientIP(request));

      const context: RequestContext = {
        correlationId,
        startTime,
        userId,
        sessionId,
        userAgent,
        ipAddress
      };

      // Store context for response correlation
      requestContexts.set(correlationId, context);

      // Log request
      logger.info(`Incoming request: ${request.method} ${request.nextUrl.pathname}`, {
        correlationId,
        userId,
        sessionId,
        ipAddress,
        userAgent
      }, {
        request: {
          method: request.method,
          url: request.nextUrl.href,
          pathname: request.nextUrl.pathname,
          search: request.nextUrl.search,
          headers: sanitizeHeaders(request.headers),
          timestamp: new Date().toISOString()
        }
      });

      return context;
    },

    logResponse: (
      correlationId: string,
      response: NextResponse,
      request: NextRequest,
      error?: Error
    ): void => {
      const context = requestContexts.get(correlationId);
      if (!context) {
        logger.warn(`No request context found for correlation ID: ${correlationId}`);
        return;
      }

      const duration = Date.now() - context.startTime;
      const statusCode = response.status;

      // Determine response size if possible
      const responseSize = getResponseSize(response);

      const apiInfo: APILogInfo = {
        method: request.method,
        path: request.nextUrl.pathname,
        statusCode,
        duration,
        requestSize: getRequestSize(request),
        responseSize,
        query: Object.fromEntries(request.nextUrl.searchParams),
        headers: sanitizeHeaders(request.headers)
      };

      // Log using specialized API logger
      logger.logAPI(apiInfo, {
        correlationId: context.correlationId,
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress
      });

      // Log error if present
      if (error) {
        logger.error(`Request failed: ${request.method} ${request.nextUrl.pathname}`, error, {
          correlationId: context.correlationId,
          userId: context.userId,
          sessionId: context.sessionId
        });
      }

      // Clean up context
      requestContexts.delete(correlationId);
    }
  };
}

function getClientIP(request: NextRequest): string {
  // Try various headers for getting real client IP
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

function hashIP(ip: string): string {
  // Simple hash function for IP anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hashed_${Math.abs(hash).toString(16)}`;
}

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = [
    'authorization', 'cookie', 'set-cookie', 'x-api-key', 
    'x-auth-token', 'x-session-token', 'x-csrf-token'
  ];

  headers.forEach((value, name) => {
    const lowerName = name.toLowerCase();
    if (sensitiveHeaders.includes(lowerName)) {
      sanitized[name] = '[REDACTED]';
    } else {
      sanitized[name] = value;
    }
  });

  return sanitized;
}

function getRequestSize(request: NextRequest): number | undefined {
  const contentLength = request.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : undefined;
}

function getResponseSize(response: NextResponse): number | undefined {
  const contentLength = response.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : undefined;
}

// Middleware hook for Next.js API routes
export function withRequestLogging<T extends any[], R>(
  handler: (...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<R> => {
    const requestLogger = createRequestLogger();
    
    // Assume first argument is request-like object
    const request = args[0] as any;
    
    if (request && typeof request === 'object' && request.method) {
      const context = requestLogger.logRequest(request);
      
      try {
        const result = await handler(...args);
        
        // If result is a response, log it
        if (result && typeof result === 'object' && 'status' in result) {
          const response = result as any;
          if (response.status && typeof response.status === 'number') {
            // Create a proper NextResponse for logging
            const logResponse = new NextResponse(null, { status: response.status });
            requestLogger.logResponse(context.correlationId, logResponse, request);
          }
        }
        
        return result;
      } catch (error) {
        // Create error response for logging
        const errorResponse = new NextResponse(null, { status: 500 });
        requestLogger.logResponse(context.correlationId, errorResponse, request, error as Error);
        throw error;
      }
    }
    
    return handler(...args);
  };
}

export default createRequestLogger; 