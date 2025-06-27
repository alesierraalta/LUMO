import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';

// Correlation ID context interface
export interface CorrelationContext {
  correlationId: string;
  requestId: string;
  sessionId?: string;
  userId?: string;
  parentSpanId?: string;
  spanId: string;
  traceId: string;
  timestamp: string;
  requestPath?: string;
  userAgent?: string;
  ipAddress?: string;
}

// AsyncLocalStorage for correlation context in Node.js
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

// Header names for correlation propagation
export const CORRELATION_HEADERS = {
  CORRELATION_ID: 'x-correlation-id',
  REQUEST_ID: 'x-request-id',
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
  SESSION_ID: 'x-session-id',
  USER_ID: 'x-user-id'
} as const;

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Generate a new span ID
 */
export function generateSpanId(): string {
  return Math.random().toString(16).slice(2, 18);
}

/**
 * Create a new correlation context
 */
export function createCorrelationContext(
  options: Partial<CorrelationContext> = {}
): CorrelationContext {
  const now = new Date().toISOString();
  
  return {
    correlationId: options.correlationId || generateCorrelationId(),
    requestId: options.requestId || generateCorrelationId(),
    traceId: options.traceId || generateTraceId(),
    spanId: options.spanId || generateSpanId(),
    parentSpanId: options.parentSpanId,
    sessionId: options.sessionId,
    userId: options.userId,
    timestamp: now,
    requestPath: options.requestPath,
    userAgent: options.userAgent,
    ipAddress: options.ipAddress
  };
}

/**
 * Extract correlation context from Next.js headers
 */
export async function extractCorrelationFromHeaders(): Promise<Partial<CorrelationContext>> {
  try {
    const headersList = await headers();
    
    return {
      correlationId: headersList.get(CORRELATION_HEADERS.CORRELATION_ID) || undefined,
      requestId: headersList.get(CORRELATION_HEADERS.REQUEST_ID) || undefined,
      traceId: headersList.get(CORRELATION_HEADERS.TRACE_ID) || undefined,
      spanId: headersList.get(CORRELATION_HEADERS.SPAN_ID) || undefined,
      parentSpanId: headersList.get(CORRELATION_HEADERS.PARENT_SPAN_ID) || undefined,
      sessionId: headersList.get(CORRELATION_HEADERS.SESSION_ID) || undefined,
      userId: headersList.get(CORRELATION_HEADERS.USER_ID) || undefined,
      userAgent: headersList.get('user-agent') || undefined,
    };
  } catch (error) {
    // Headers not available (likely client-side or edge runtime)
    return {};
  }
}

/**
 * Extract correlation context from request headers (for API routes)
 */
export function extractCorrelationFromRequest(request: Request): Partial<CorrelationContext> {
  const url = new URL(request.url);
  
  return {
    correlationId: request.headers.get(CORRELATION_HEADERS.CORRELATION_ID) || undefined,
    requestId: request.headers.get(CORRELATION_HEADERS.REQUEST_ID) || undefined,
    traceId: request.headers.get(CORRELATION_HEADERS.TRACE_ID) || undefined,
    spanId: request.headers.get(CORRELATION_HEADERS.SPAN_ID) || undefined,
    parentSpanId: request.headers.get(CORRELATION_HEADERS.PARENT_SPAN_ID) || undefined,
    sessionId: request.headers.get(CORRELATION_HEADERS.SESSION_ID) || undefined,
    userId: request.headers.get(CORRELATION_HEADERS.USER_ID) || undefined,
    requestPath: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
  };
}

/**
 * Get current correlation context
 */
export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

/**
 * Set correlation context for the current async execution
 */
export function runWithCorrelation<T>(
  context: CorrelationContext,
  callback: () => T
): T {
  return correlationStorage.run(context, callback);
}

/**
 * Create child span from current context
 */
export function createChildSpan(
  operation: string,
  additionalContext: Partial<CorrelationContext> = {}
): CorrelationContext {
  const currentContext = getCorrelationContext();
  
  if (!currentContext) {
    // No parent context, create new root context
    return createCorrelationContext({
      ...additionalContext,
      spanId: generateSpanId()
    });
  }

  // Create child span
  return {
    ...currentContext,
    ...additionalContext,
    parentSpanId: currentContext.spanId,
    spanId: generateSpanId(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Add correlation headers to a Headers object
 */
export function addCorrelationHeaders(
  headers: Headers,
  context: CorrelationContext
): void {
  headers.set(CORRELATION_HEADERS.CORRELATION_ID, context.correlationId);
  headers.set(CORRELATION_HEADERS.REQUEST_ID, context.requestId);
  headers.set(CORRELATION_HEADERS.TRACE_ID, context.traceId);
  headers.set(CORRELATION_HEADERS.SPAN_ID, context.spanId);
  
  if (context.parentSpanId) {
    headers.set(CORRELATION_HEADERS.PARENT_SPAN_ID, context.parentSpanId);
  }
  
  if (context.sessionId) {
    headers.set(CORRELATION_HEADERS.SESSION_ID, context.sessionId);
  }
  
  if (context.userId) {
    headers.set(CORRELATION_HEADERS.USER_ID, context.userId);
  }
}

/**
 * Create correlation headers object for fetch requests
 */
export function createCorrelationHeaders(
  context?: CorrelationContext
): Record<string, string> {
  const ctx = context || getCorrelationContext();
  
  if (!ctx) {
    return {};
  }

  const headers: Record<string, string> = {
    [CORRELATION_HEADERS.CORRELATION_ID]: ctx.correlationId,
    [CORRELATION_HEADERS.REQUEST_ID]: ctx.requestId,
    [CORRELATION_HEADERS.TRACE_ID]: ctx.traceId,
    [CORRELATION_HEADERS.SPAN_ID]: ctx.spanId
  };

  if (ctx.parentSpanId) {
    headers[CORRELATION_HEADERS.PARENT_SPAN_ID] = ctx.parentSpanId;
  }

  if (ctx.sessionId) {
    headers[CORRELATION_HEADERS.SESSION_ID] = ctx.sessionId;
  }

  if (ctx.userId) {
    headers[CORRELATION_HEADERS.USER_ID] = ctx.userId;
  }

  return headers;
}

/**
 * Client-side correlation context management
 */
export class ClientCorrelationManager {
  private static instance: ClientCorrelationManager;
  private currentContext: CorrelationContext | null = null;

  static getInstance(): ClientCorrelationManager {
    if (!ClientCorrelationManager.instance) {
      ClientCorrelationManager.instance = new ClientCorrelationManager();
    }
    return ClientCorrelationManager.instance;
  }

  setContext(context: CorrelationContext): void {
    this.currentContext = context;
    
    // Store in sessionStorage for persistence across page reloads
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem('correlation-context', JSON.stringify(context));
      } catch (error) {
        console.warn('Failed to store correlation context in sessionStorage:', error);
      }
    }
  }

  getContext(): CorrelationContext | null {
    if (this.currentContext) {
      return this.currentContext;
    }

    // Try to restore from sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem('correlation-context');
        if (stored) {
          this.currentContext = JSON.parse(stored);
          return this.currentContext;
        }
      } catch (error) {
        console.warn('Failed to restore correlation context from sessionStorage:', error);
      }
    }

    return null;
  }

  createNewContext(options: Partial<CorrelationContext> = {}): CorrelationContext {
    const context = createCorrelationContext({
      ...options,
      requestPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });
    
    this.setContext(context);
    return context;
  }

  createChildContext(operation: string): CorrelationContext {
    const currentContext = this.getContext();
    
    if (!currentContext) {
      return this.createNewContext();
    }

    const childContext = createChildSpan(operation, {
      requestPath: typeof window !== 'undefined' ? window.location.pathname : undefined
    });
    
    this.setContext(childContext);
    return childContext;
  }

  clear(): void {
    this.currentContext = null;
    
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem('correlation-context');
      } catch (error) {
        console.warn('Failed to clear correlation context from sessionStorage:', error);
      }
    }
  }
}

/**
 * Hook for React components to use correlation context
 */
export function useCorrelation() {
  const manager = ClientCorrelationManager.getInstance();
  
  return {
    getContext: () => manager.getContext(),
    createContext: (options?: Partial<CorrelationContext>) => manager.createNewContext(options),
    createChildContext: (operation: string) => manager.createChildContext(operation),
    clear: () => manager.clear()
  };
}

/**
 * Utility to wrap fetch requests with correlation headers
 */
export function correlatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  context?: CorrelationContext
): Promise<Response> {
  const correlationHeaders = createCorrelationHeaders(context);
  
  const enhancedInit: RequestInit = {
    ...init,
    headers: {
      ...init?.headers,
      ...correlationHeaders
    }
  };

  return fetch(input, enhancedInit);
}

/**
 * Performance timing utilities with correlation
 */
export class CorrelatedTimer {
  private startTime: number;
  private context: CorrelationContext;
  private operation: string;

  constructor(operation: string, context?: CorrelationContext) {
    this.operation = operation;
    this.context = context || getCorrelationContext() || createCorrelationContext();
    this.startTime = performance.now();
  }

  end(): { duration: number; context: CorrelationContext } {
    const duration = performance.now() - this.startTime;
    
    return {
      duration,
      context: {
        ...this.context,
        timestamp: new Date().toISOString()
      }
    };
  }

  endWithLog(logger: any, message?: string): { duration: number; context: CorrelationContext } {
    const result = this.end();
    
    logger.info(
      message || `Operation ${this.operation} completed`,
      { 
        correlationId: result.context.correlationId,
        operation: this.operation 
      },
      { 
        performance: { 
          duration: result.duration,
          operation: this.operation
        }
      }
    );

    return result;
  }
}

/**
 * Create a correlated timer
 */
export function createTimer(operation: string, context?: CorrelationContext): CorrelatedTimer {
  return new CorrelatedTimer(operation, context);
} 