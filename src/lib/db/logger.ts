import logger from '../logger';
import { DatabaseLogInfo } from '../logger/types';

export interface DatabaseContext {
  correlationId?: string;
  userId?: string;
  operation: string;
  table?: string;
  startTime: number;
  connectionId?: string;
}

export class DatabaseLogger {
  private contexts = new Map<string, DatabaseContext>();

  startOperation(
    operation: string,
    table?: string,
    correlationId?: string,
    userId?: string
  ): string {
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const context: DatabaseContext = {
      correlationId,
      userId,
      operation,
      table,
      startTime,
      connectionId: this.generateConnectionId()
    };

    this.contexts.set(operationId, context);

    logger.debug(`Database operation started: ${operation}`, {
      correlationId,
      userId
    }, {
      database: {
        operationId,
        operation,
        table,
        startTime: new Date(startTime).toISOString()
      }
    });

    return operationId;
  }

  endOperation(
    operationId: string,
    rowsAffected?: number,
    error?: Error,
    query?: string
  ): void {
    const context = this.contexts.get(operationId);
    if (!context) {
      logger.warn(`No database context found for operation ID: ${operationId}`);
      return;
    }

    const duration = Date.now() - context.startTime;
    const dbInfo: DatabaseLogInfo = {
      operation: context.operation,
      table: context.table,
      duration,
      rowsAffected,
      connectionId: context.connectionId,
      query: this.sanitizeQuery(query)
    };

    if (error) {
      logger.error(`Database operation failed: ${context.operation}`, error, {
        correlationId: context.correlationId,
        userId: context.userId
      }, {
        database: {
          operationId,
          ...dbInfo,
          error: {
            name: error.name,
            message: error.message
          }
        }
      });
    } else {
      logger.logDatabase(dbInfo, {
        correlationId: context.correlationId,
        userId: context.userId
      });
    }

    // Clean up context
    this.contexts.delete(operationId);
  }

  logSlowQuery(query: string, duration: number, correlationId?: string): void {
    logger.warn(`Slow database query detected (${duration}ms)`, {
      correlationId
    }, {
      database: {
        slowQuery: true,
        query: this.sanitizeQuery(query),
        duration,
        threshold: 100
      }
    });
  }

  logConnectionPool(stats: {
    total: number;
    idle: number;
    active: number;
    waiting: number;
  }): void {
    logger.info('Database connection pool status', undefined, {
      database: {
        connectionPool: stats,
        timestamp: new Date().toISOString()
      }
    });
  }

  logMigration(
    operation: 'start' | 'success' | 'error',
    migrationName: string,
    error?: Error
  ): void {
    const level = operation === 'error' ? 'error' : 'info';
    const message = `Database migration ${operation}: ${migrationName}`;

    if (operation === 'error' && error) {
      logger.error(message, error, undefined, {
        database: {
          migration: {
            name: migrationName,
            operation,
            error: error.message
          }
        }
      });
    } else {
      logger.info(message, undefined, {
        database: {
          migration: {
            name: migrationName,
            operation,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  }

  private sanitizeQuery(query?: string): string | undefined {
    if (!query) return undefined;

    // Remove sensitive data patterns from queries
    let sanitized = query;

    // Replace string literals that might contain sensitive data
    sanitized = sanitized.replace(/'([^']*password[^']*)'/gi, "'[REDACTED]'");
    sanitized = sanitized.replace(/'([^']*token[^']*)'/gi, "'[REDACTED]'");
    sanitized = sanitized.replace(/'([^']*secret[^']*)'/gi, "'[REDACTED]'");
    sanitized = sanitized.replace(/'([^']*key[^']*)'/gi, "'[REDACTED]'");

    // Replace email patterns
    sanitized = sanitized.replace(/'[^']*@[^']*'/gi, "'[EMAIL_REDACTED]'");

    // Limit query length for logging
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000) + '... [TRUNCATED]';
    }

    return sanitized;
  }

  private generateConnectionId(): string {
    return `conn_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global database logger instance
export const dbLogger = new DatabaseLogger();

// Utility functions for common database operations
export const logQuery = (
  operation: string,
  table: string,
  query: string,
  duration: number,
  rowsAffected?: number,
  correlationId?: string,
  userId?: string
) => {
  const dbInfo: DatabaseLogInfo = {
    operation,
    table,
    duration,
    rowsAffected,
    query: dbLogger['sanitizeQuery'](query)
  };

  logger.logDatabase(dbInfo, {
    correlationId,
    userId
  });

  // Check for slow query
  if (duration > 100) {
    dbLogger.logSlowQuery(query, duration, correlationId);
  }
};

export const logTransaction = (
  operation: 'start' | 'commit' | 'rollback',
  transactionId: string,
  correlationId?: string,
  userId?: string
) => {
  logger.info(`Database transaction ${operation}`, {
    correlationId,
    userId
  }, {
    database: {
      transaction: {
        id: transactionId,
        operation,
        timestamp: new Date().toISOString()
      }
    }
  });
}; 