import { NextRequest, NextResponse } from 'next/server';
import { 
  createCorrelationContext,
  extractCorrelationFromRequest,
  addCorrelationHeaders,
  runWithCorrelation,
  CORRELATION_HEADERS,
  CorrelationContext
} from '../logger/correlation';

/**
 * Enhanced middleware for correlation ID propagation
 * This middleware ensures every request has proper correlation tracking
 */
export function createCorrelationMiddleware() {
  return async function correlationMiddleware(request: NextRequest) {
    // Extract existing correlation context from headers
    const existingContext = extractCorrelationFromRequest(request);
    
    // Create or enhance correlation context
    const correlationContext = createCorrelationContext({
      ...existingContext,
      requestPath: new URL(request.url).pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    // Create response with correlation headers
    const response = NextResponse.next();
    
    // Add correlation headers to response
    addCorrelationHeaders(response.headers, correlationContext);
    
    // Add custom headers for debugging
    response.headers.set('x-lumo-debug-enabled', 'true');
    response.headers.set('x-lumo-trace-timestamp', new Date().toISOString());
    
    // Store correlation context in request for API routes
    // Note: This is a workaround since we can't directly modify request object
    response.headers.set('x-lumo-correlation-data', JSON.stringify(correlationContext));

    return response;
  };
}

/**
 * Utility to extract correlation context from middleware response headers
 */
export function getCorrelationFromResponse(response: Response): CorrelationContext | null {
  try {
    const correlationData = response.headers.get('x-lumo-correlation-data');
    if (correlationData) {
      return JSON.parse(correlationData);
    }
  } catch (error) {
    console.warn('Failed to parse correlation data from response headers:', error);
  }
  return null;
}

/**
 * API route wrapper for correlation context
 */
export function withCorrelation<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    
    if (request && typeof request === 'object' && 'headers' in request) {
      // Extract correlation context from request
      const correlationContext = extractCorrelationFromRequest(request as Request);
      const fullContext = createCorrelationContext(correlationContext);
      
      // Run handler with correlation context
      return runWithCorrelation(fullContext, () => handler(...args));
    }
    
    // Fallback: run without correlation context
    return handler(...args);
  }) as T;
}

/**
 * Request logging middleware for API routes
 */
export function logRequest(request: NextRequest, correlationContext: CorrelationContext) {
  const startTime = performance.now();
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;
  const query = url.search;
  
  // Log request start
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `${method} ${path} - Request started`,
    context: {
      correlationId: correlationContext.correlationId,
      traceId: correlationContext.traceId,
      spanId: correlationContext.spanId,
      service: 'lumo-inventory'
    },
    metadata: {
      request: {
        method,
        path,
        query,
        userAgent: correlationContext.userAgent,
        ipAddress: correlationContext.ipAddress,
        timestamp: correlationContext.timestamp
      },
      performance: {
        startTime
      }
    }
  }));
  
  return {
    startTime,
    logResponse: (response: NextResponse, error?: Error) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const statusCode = response.status || (error ? 500 : 200);
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
        message: `${method} ${path} - ${statusCode} (${duration.toFixed(2)}ms)`,
        context: {
          correlationId: correlationContext.correlationId,
          traceId: correlationContext.traceId,
          spanId: correlationContext.spanId,
          service: 'lumo-inventory'
        },
        metadata: {
          request: {
            method,
            path,
            query,
            userAgent: correlationContext.userAgent,
            ipAddress: correlationContext.ipAddress
          },
          response: {
            statusCode,
            duration,
            timestamp: new Date().toISOString()
          },
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : undefined
        }
      }));
    }
  };
}

/**
 * Enhanced API route wrapper with automatic request/response logging
 */
export function withEnhancedLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    
    if (!request || typeof request !== 'object' || !('headers' in request)) {
      return handler(...args);
    }
    
    // Extract correlation context
    const correlationContext = extractCorrelationFromRequest(request as Request);
    const fullContext = createCorrelationContext(correlationContext);
    
    // Start request logging
    const requestLogger = logRequest(request as NextRequest, fullContext);
    
    try {
      // Run handler with correlation context
      const response = await runWithCorrelation(fullContext, () => handler(...args));
      
      // Log successful response
      requestLogger.logResponse(response);
      
      // Add correlation headers to response
      addCorrelationHeaders(response.headers, fullContext);
      
      return response;
    } catch (error) {
      // Log error response
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      
      requestLogger.logResponse(errorResponse, error as Error);
      
      // Add correlation headers to error response
      addCorrelationHeaders(errorResponse.headers, fullContext);
      
      throw error;
    }
  }) as T;
}

/**
 * Database operation wrapper with correlation
 */
export async function withDatabaseCorrelation<T>(
  operation: string,
  callback: () => Promise<T>,
  additionalContext?: Record<string, any>
): Promise<T> {
  const timer = performance.now();
  const correlationContext = createCorrelationContext();
  
  try {
    const result = await runWithCorrelation(correlationContext, callback);
    const duration = performance.now() - timer;
    
    // Log successful database operation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Database operation ${operation} completed`,
      context: {
        correlationId: correlationContext.correlationId,
        traceId: correlationContext.traceId,
        spanId: correlationContext.spanId,
        service: 'lumo-inventory'
      },
      metadata: {
        database: {
          operation,
          duration,
          success: true,
          ...additionalContext
        }
      }
    }));
    
    return result;
  } catch (error) {
    const duration = performance.now() - timer;
    
    // Log failed database operation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `Database operation ${operation} failed`,
      context: {
        correlationId: correlationContext.correlationId,
        traceId: correlationContext.traceId,
        spanId: correlationContext.spanId,
        service: 'lumo-inventory'
      },
      metadata: {
        database: {
          operation,
          duration,
          success: false,
          ...additionalContext
        },
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        }
      }
    }));
    
    throw error;
  }
} 