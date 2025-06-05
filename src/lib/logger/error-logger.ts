import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better organization
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external-service',
  FILE_SYSTEM = 'file-system',
  NETWORKING = 'networking',
  PARSING = 'parsing',
  APPLICATION = 'application',
  UNEXPECTED = 'unexpected',
}

// Interface for error context information
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  module?: string;
  component?: string;
  operation?: string;
  path?: string;
  method?: string;
  query?: Record<string, any>;
  params?: Record<string, any>;
  input?: any;
  additionalInfo?: Record<string, any>;
}

// Interface for error record
export interface ErrorRecord {
  id: string;
  timestamp: string;
  message: string;
  code?: string | number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  stack?: string;
  originalError?: Error;
  context: ErrorContext;
}

/**
 * Error Logger - Centralized system for consistent error logging
 */
class ErrorLogger {
  // Map to track repeated errors and avoid excessive logging
  private errorFrequencyMap: Map<string, { count: number, lastLogged: number }> = new Map();
  
  // Throttle period for repeated errors (5 minutes)
  private readonly ERROR_THROTTLE_MS = 5 * 60 * 1000;
  
  /**
   * Log an error with consistent formatting and context
   */
  logError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.APPLICATION,
    context: ErrorContext = {}
  ): string {
    // Generate or reuse error ID
    const errorId = (error as any)._errorId || uuidv4().slice(0, 8);
    
    // Add error ID to original error to enable tracking through the system
    if (error instanceof Error) {
      (error as any)._errorId = errorId;
    }
    
    // Extract message and stack from error or string
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    // Create error signature for deduplication based on message and location
    const errorLocation = stack 
      ? stack.split('\n')[1]?.trim() || 'unknown' 
      : 'unknown';
    const errorSignature = `${message}:${errorLocation}`;
    
    // Check for repeated errors to avoid flooding logs
    const now = Date.now();
    const errorFreq = this.errorFrequencyMap.get(errorSignature);
    
    if (errorFreq && (now - errorFreq.lastLogged) < this.ERROR_THROTTLE_MS) {
      // Increment count for repeated error
      errorFreq.count++;
      
      // Only log every 10th occurrence during throttle period
      if (errorFreq.count % 10 !== 0) {
        return errorId;
      }
      
      // Update timestamp for rate limiting
      errorFreq.lastLogged = now;
    } else {
      // First occurrence or outside throttle period
      this.errorFrequencyMap.set(errorSignature, {
        count: 1,
        lastLogged: now
      });
    }
    
    // Create consistent error record
    const errorRecord: ErrorRecord = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message,
      code: (error as any).code || (error as any).statusCode,
      severity,
      category,
      stack,
      originalError: error instanceof Error ? error : undefined,
      context: {
        ...context,
        // Add timestamp for temporal context
        timestamp: new Date().toISOString(),
      },
    };
    
    // Determine log level based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.fatal(`[${errorId}] ${message}`, error instanceof Error ? error : undefined, {
          module: context.module || 'error',
          component: context.component || 'errorLogger',
        }, { error: errorRecord });
        break;
        
      case ErrorSeverity.HIGH:
        logger.error(`[${errorId}] ${message}`, error instanceof Error ? error : undefined, {
          module: context.module || 'error',
          component: context.component || 'errorLogger',
        }, { error: errorRecord });
        break;
        
      case ErrorSeverity.MEDIUM:
        logger.warn(`[${errorId}] ${message}`, {
          module: context.module || 'error',
          component: context.component || 'errorLogger',
        }, { error: errorRecord });
        break;
        
      case ErrorSeverity.LOW:
        logger.info(`[${errorId}] ${message}`, {
          module: context.module || 'error',
          component: context.component || 'errorLogger',
        }, { error: errorRecord });
        break;
    }
    
    return errorId;
  }
  
  /**
   * Helper method to log validation errors
   */
  logValidationError(error: Error | string, context: ErrorContext = {}): string {
    return this.logError(error, ErrorSeverity.LOW, ErrorCategory.VALIDATION, context);
  }
  
  /**
   * Helper method to log authentication errors
   */
  logAuthError(error: Error | string, context: ErrorContext = {}): string {
    return this.logError(error, ErrorSeverity.MEDIUM, ErrorCategory.AUTHENTICATION, context);
  }
  
  /**
   * Helper method to log database errors
   */
  logDatabaseError(error: Error | string, context: ErrorContext = {}): string {
    return this.logError(error, ErrorSeverity.HIGH, ErrorCategory.DATABASE, context);
  }
  
  /**
   * Helper method to log unexpected/critical errors
   */
  logCriticalError(error: Error | string, context: ErrorContext = {}): string {
    return this.logError(error, ErrorSeverity.CRITICAL, ErrorCategory.UNEXPECTED, context);
  }
  
  /**
   * Create an error handler function for API routes
   */
  createApiErrorHandler(defaultContext: ErrorContext = {}) {
    return (error: Error | any, additionalContext: ErrorContext = {}) => {
      const context: ErrorContext = {
        ...defaultContext,
        ...additionalContext,
      };
      
      // Determine error category based on error type
      let category = ErrorCategory.APPLICATION;
      let severity = ErrorSeverity.MEDIUM;
      
      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        category = ErrorCategory.VALIDATION;
        severity = ErrorSeverity.LOW;
      } else if (error.name === 'UnauthorizedError' || error.message?.includes('unauthorized')) {
        category = ErrorCategory.AUTHORIZATION;
        severity = ErrorSeverity.MEDIUM;
      } else if (error.name?.includes('Prisma') || error.message?.includes('database')) {
        category = ErrorCategory.DATABASE;
        severity = ErrorSeverity.HIGH;
      }
      
      return this.logError(error, severity, category, context);
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Default export for convenience
export default errorLogger; 