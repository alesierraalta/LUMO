import { LogLevel } from './types';
import { getCorrelationContext } from './correlation';
import { performanceMetrics, MetricType } from './performance-metrics';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Request logging configuration
 */
export interface RequestLoggingConfig {
  enabled: boolean;
  logLevel: LogLevel;
  includeHeaders: boolean;
  includeBody: boolean;
  includeQuery: boolean;
  includeCookies: boolean;
  sensitiveHeaders: string[];
  sensitiveBodyFields: string[];
  maxBodySize: number;
  maxResponseSize: number;
  excludePaths: string[];
  includeOnlyPaths?: string[];
  logSlowRequests: boolean;
  slowRequestThreshold: number;
  logErrors: boolean;
  logSuccessful: boolean;
  enableSampling: boolean;
  samplingRate: number;
}

/**
 * Request context information
 */
export interface RequestContext {
  correlationId: string;
  traceId: string;
  requestId: string;
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  body?: any;
  bodySize: number;
}

/**
 * Response context information
 */
export interface ResponseContext {
  correlationId: string;
  traceId: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  bodySize: number;
  duration: number;
  timestamp: string;
  cached?: boolean;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Complete request/response log entry
 */
export interface RequestResponseLog {
  correlationId: string;
  traceId: string;
  requestId: string;
  type: 'request' | 'response' | 'complete';
  request: RequestContext;
  response?: ResponseContext;
  performance: {
    duration: number;
    databaseQueries: number;
    externalCalls: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  metadata: {
    environment: string;
    service: string;
    version: string;
    deployment: string;
    component: string;
  };
  timestamp: string;
}

/**
 * Request/Response logger class
 */
export class RequestResponseLogger {
  private config: RequestLoggingConfig;
  private activeRequests: Map<string, RequestContext> = new Map();
  private requestStartTimes: Map<string, number> = new Map();
  
  constructor(config: Partial<RequestLoggingConfig> = {}) {
    this.config = {
      enabled: true,
      logLevel: LogLevel.INFO,
      includeHeaders: true,
      includeBody: false,
      includeQuery: true,
      includeCookies: false,
      sensitiveHeaders: [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token',
        'x-session-token'
      ],
      sensitiveBodyFields: [
        'password',
        'token',
        'secret',
        'key',
        'auth',
        'credential'
      ],
      maxBodySize: 10240,
      maxResponseSize: 51200,
      excludePaths: [
        '/health',
        '/favicon.ico',
        '/_next/static',
        '/_next/image',
        '/api/health'
      ],
      logSlowRequests: true,
      slowRequestThreshold: 1000,
      logErrors: true,
      logSuccessful: true,
      enableSampling: false,
      samplingRate: 1.0,
      ...config
    };
  }

  /**
   * Log incoming request
   */
  logRequest(request: NextRequest, additionalContext?: Partial<RequestContext>): string {
    if (!this.config.enabled || !this.shouldLogRequest(request)) {
      return '';
    }

    const correlationContext = getCorrelationContext();
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.requestStartTimes.set(requestId, startTime);

    const requestContext: RequestContext = {
      correlationId: correlationContext?.correlationId || this.generateCorrelationId(),
      traceId: correlationContext?.traceId || this.generateTraceId(),
      requestId,
      method: request.method,
      url: request.url,
      path: new URL(request.url).pathname,
      query: this.extractQuery(request),
      headers: this.sanitizeHeaders(request.headers),
      cookies: this.extractCookies(request),
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.extractIpAddress(request),
      timestamp: new Date().toISOString(),
      bodySize: 0,
      ...additionalContext
    };

    this.activeRequests.set(requestId, requestContext);

    // Correlation context is automatically managed by the correlation system

    const logEntry = {
      timestamp: requestContext.timestamp,
      level: this.config.logLevel,
      message: `🔄 Request: ${requestContext.method} ${requestContext.path}`,
      context: {
        correlationId: requestContext.correlationId,
        traceId: requestContext.traceId,
        requestId: requestContext.requestId,
        service: 'lumo-inventory',
        type: 'request'
      },
      metadata: {
        request: requestContext,
        requestLogging: true
      }
    };

    console.log(JSON.stringify(logEntry));

    // Performance metrics integration available but simplified for stability

    return requestId;
  }

  /**
   * Log outgoing response
   */
  logResponse(
    requestId: string, 
    response: NextResponse | Response, 
    additionalContext?: Partial<ResponseContext>
  ): void {
    if (!this.config.enabled || !requestId) {
      return;
    }

    const requestContext = this.activeRequests.get(requestId);
    if (!requestContext) {
      console.warn(`No request context found for requestId: ${requestId}`);
      return;
    }

    const startTime = this.requestStartTimes.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    const responseContext: ResponseContext = {
      correlationId: requestContext.correlationId,
      traceId: requestContext.traceId,
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers: this.sanitizeResponseHeaders(response.headers),
      bodySize: 0,
      duration,
      timestamp,
      ...additionalContext
    };

    const completeLog: RequestResponseLog = {
      correlationId: requestContext.correlationId,
      traceId: requestContext.traceId,
      requestId,
      type: 'complete',
      request: requestContext,
      response: responseContext,
      performance: {
        duration,
        databaseQueries: 0,
        externalCalls: 0,
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'lumo-inventory',
        version: process.env.npm_package_version || '1.0.0',
        deployment: process.env.CHOREO_ENVIRONMENT || 'local',
        component: 'request_response_logger'
      },
      timestamp
    };

    let logLevel = this.config.logLevel;
    let logMessage = `✅ Response: ${requestContext.method} ${requestContext.path} - ${responseContext.status} (${duration}ms)`;
    
    if (responseContext.status >= 500) {
      logLevel = LogLevel.ERROR;
      logMessage = `❌ Error Response: ${requestContext.method} ${requestContext.path} - ${responseContext.status} (${duration}ms)`;
    } else if (responseContext.status >= 400) {
      logLevel = LogLevel.WARN;
      logMessage = `⚠️ Client Error: ${requestContext.method} ${requestContext.path} - ${responseContext.status} (${duration}ms)`;
    } else if (duration > this.config.slowRequestThreshold) {
      logLevel = LogLevel.WARN;
      logMessage = `🐌 Slow Response: ${requestContext.method} ${requestContext.path} - ${responseContext.status} (${duration}ms)`;
    }

    const logEntry = {
      timestamp,
      level: logLevel,
      message: logMessage,
      context: {
        correlationId: requestContext.correlationId,
        traceId: requestContext.traceId,
        requestId,
        service: 'lumo-inventory',
        type: 'response'
      },
      metadata: {
        requestResponse: completeLog,
        requestLogging: true
      }
    };

    console.log(JSON.stringify(logEntry));

    // Performance metrics integration simplified for stability
    console.log(`📊 Request Performance: ${requestContext.method} ${requestContext.path} - ${duration}ms`);

    this.activeRequests.delete(requestId);
    this.requestStartTimes.delete(requestId);
  }

  /**
   * Log request error
   */
  logRequestError(requestId: string, error: Error, additionalContext?: any): void {
    if (!this.config.enabled || !this.config.logErrors) {
      return;
    }

    const requestContext = this.activeRequests.get(requestId);
    const startTime = this.requestStartTimes.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    const errorResponse: ResponseContext = {
      correlationId: requestContext?.correlationId || 'unknown',
      traceId: requestContext?.traceId || 'unknown',
      requestId: requestId || 'unknown',
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      bodySize: 0,
      duration,
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    const logEntry = {
      timestamp,
      level: LogLevel.ERROR,
      message: `💥 Request Error: ${error.message}`,
      context: {
        correlationId: requestContext?.correlationId,
        traceId: requestContext?.traceId,
        requestId,
        service: 'lumo-inventory',
        type: 'error'
      },
      metadata: {
        error: errorResponse,
        requestContext,
        additionalContext,
        requestLogging: true
      }
    };

    console.error(JSON.stringify(logEntry));

    if (requestId) {
      this.activeRequests.delete(requestId);
      this.requestStartTimes.delete(requestId);
    }
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get request context by ID
   */
  getRequestContext(requestId: string): RequestContext | undefined {
    return this.activeRequests.get(requestId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RequestLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Should log this request?
   */
  private shouldLogRequest(request: NextRequest): boolean {
    const path = new URL(request.url).pathname;
    
    if (this.config.excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return false;
    }

    if (this.config.includeOnlyPaths && 
        !this.config.includeOnlyPaths.some(includePath => path.startsWith(includePath))) {
      return false;
    }

    if (this.config.enableSampling && Math.random() > this.config.samplingRate) {
      return false;
    }

    return true;
  }

  /**
   * Extract query parameters
   */
  private extractQuery(request: NextRequest): Record<string, string | string[]> {
    const query: Record<string, string | string[]> = {};
    if (!this.config.includeQuery) return query;

    const url = new URL(request.url);
    url.searchParams.forEach((value, key) => {
      if (query[key]) {
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(value);
        } else {
          query[key] = [query[key] as string, value];
        }
      } else {
        query[key] = value;
      }
    });

    return query;
  }

  /**
   * Extract and sanitize cookies
   */
  private extractCookies(request: NextRequest): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!this.config.includeCookies) return cookies;

    request.cookies.getAll().forEach(cookie => {
      cookies[cookie.name] = this.isSensitiveField(cookie.name) ? '[REDACTED]' : cookie.value;
    });

    return cookies;
  }

  /**
   * Sanitize request headers
   */
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    if (!this.config.includeHeaders) return sanitized;

    headers.forEach((value, key) => {
      sanitized[key.toLowerCase()] = this.isSensitiveHeader(key) ? '[REDACTED]' : value;
    });

    return sanitized;
  }

  /**
   * Sanitize response headers
   */
  private sanitizeResponseHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      sanitized[key.toLowerCase()] = this.isSensitiveHeader(key) ? '[REDACTED]' : value;
    });

    return sanitized;
  }

  /**
   * Check if header is sensitive
   */
  private isSensitiveHeader(headerName: string): boolean {
    return this.config.sensitiveHeaders.some(sensitive => 
      headerName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Check if field is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    return this.config.sensitiveBodyFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(request: NextRequest): string | undefined {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('x-client-ip') ||
           undefined;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * Global request/response logger instance
 */
export const requestResponseLogger = new RequestResponseLogger();

/**
 * Middleware integration utilities
 */
export const RequestResponseLoggingMiddleware = {
  /**
   * Next.js middleware integration
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const requestId = requestResponseLogger.logRequest(request);
    
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-correlation-id', getCorrelationContext()?.correlationId || '');
    
    return response;
  },

  /**
   * API route wrapper - simplified for type safety
   */
  wrapApiRoute(
    handler: (request: NextRequest, ...args: any[]) => Promise<any>
  ): (request: NextRequest, ...args: any[]) => Promise<any> {
    return async (request: NextRequest, ...args: any[]): Promise<any> => {
      const requestId = requestResponseLogger.logRequest(request);
      
      try {
        const result = await handler(request, ...args);
        
        if (result instanceof Response) {
          requestResponseLogger.logResponse(requestId, result);
        }
        
        return result;
      } catch (error) {
        requestResponseLogger.logRequestError(requestId, error as Error);
        throw error;
      }
    };
  }
};