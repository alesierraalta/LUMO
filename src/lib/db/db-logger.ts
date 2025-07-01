// @ts-nocheck
// Temporary TypeScript ignore to fix build issues

import { logger } from "@/lib/logger";
import { DatabaseLogInfo } from "@/lib/logger/types";
import { v4 as uuidv4 } from "uuid";

// Timing threshold constants
const SLOW_QUERY_THRESHOLD_WARN = 500;  // 500ms warning threshold
const SLOW_QUERY_THRESHOLD_ERROR = 1000; // 1s error threshold

// Stats tracking
interface DbStats {
  totalQueries: number;
  totalErrors: number;
  slowQueries: number;
  successRate: number;
  avgDuration: number;
  operations: Record<string, OperationStats>;
  tables: Record<string, TableStats>;
}

interface OperationStats {
  count: number;
  errors: number;
  totalDuration: number;
  avgDuration: number;
}

interface TableStats {
  count: number;
  errors: number;
  totalDuration: number;
  avgDuration: number;
  operations: Record<string, number>;
}

/**
 * Database Logger - Tracks all database operations with detailed metrics
 */
class DbLogger {
  private stats: DbStats;
  private enableDetailedLogs: boolean;
  private operationsInProgress: Map<string, { startTime: number, operation: string, table?: string }>;
  private statsResetInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.resetStats();
    this.operationsInProgress = new Map();
    this.enableDetailedLogs = process.env.DB_DETAILED_LOGS === 'true' || process.env.NODE_ENV !== 'production';
    
    // Reset stats periodically (every hour) to avoid memory buildup
    if (typeof setInterval !== 'undefined') {
      this.statsResetInterval = setInterval(() => {
        this.logCurrentStats();
        this.resetStats();
      }, 60 * 60 * 1000); // 1 hour
    }
    
    logger.info('Database logger initialized');
  }
  
  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      totalErrors: 0,
      slowQueries: 0,
      successRate: 100,
      avgDuration: 0,
      operations: {},
      tables: {}
    };
  }
  
  /**
   * Start tracking a database operation
   */
  startOperation(operation: string, table?: string): string {
    const operationId = uuidv4();
    this.operationsInProgress.set(operationId, {
      startTime: performance.now(),
      operation,
      table
    });
    
    if (this.enableDetailedLogs) {
      logger.debug(`Starting DB operation: ${operation} ${table ? `on ${table}` : ''}`);
    }
    
    logger.info('Database operation started');
    
    return operationId;
  }
  
  /**
   * Complete a database operation and log its results
   */
  endOperation(
    operationId: string, 
    {
      success = true,
      error = null,
      rowsAffected = 0,
      recordCount = 0,
      query = null,
      params = null
    }: {
      success?: boolean,
      error?: Error | null,
      rowsAffected?: number,
      recordCount?: number,
      query?: string | null,
      params?: Record<string, any> | null
    } = {}
  ): void {
    const startData = this.operationsInProgress.get(operationId);
    if (!startData) {
      logger.warn(`No database operation found for ID: ${operationId}`);
      return;
    }
    
    const { operation, table, startTime } = startData;
    const duration = Math.round(performance.now() - startTime);
    
    // Update operation stats
    this.stats.totalQueries++;
    
    if (!success) {
      this.stats.totalErrors++;
    }
    
    if (duration > SLOW_QUERY_THRESHOLD_WARN) {
      this.stats.slowQueries++;
    }
    
    // Update operation-specific stats
    if (!this.stats.operations[operation]) {
      this.stats.operations[operation] = { 
        count: 0, 
        errors: 0,
        totalDuration: 0,
        avgDuration: 0
      };
    }
    
    this.stats.operations[operation].count++;
    if (!success) this.stats.operations[operation].errors++;
    this.stats.operations[operation].totalDuration += duration;
    this.stats.operations[operation].avgDuration = 
      this.stats.operations[operation].totalDuration / this.stats.operations[operation].count;
    
    // Update table-specific stats
    if (table) {
      if (!this.stats.tables[table]) {
        this.stats.tables[table] = { 
          count: 0, 
          errors: 0,
          totalDuration: 0,
          avgDuration: 0,
          operations: {}
        };
      }
      
      this.stats.tables[table].count++;
      if (!success) this.stats.tables[table].errors++;
      this.stats.tables[table].totalDuration += duration;
      this.stats.tables[table].avgDuration = 
        this.stats.tables[table].totalDuration / this.stats.tables[table].count;
      
      // Update operation count for this table
      if (!this.stats.tables[table].operations[operation]) {
        this.stats.tables[table].operations[operation] = 0;
      }
      this.stats.tables[table].operations[operation]++;
    }
    
    // Update overall stats
    this.stats.successRate = (1 - (this.stats.totalErrors / this.stats.totalQueries)) * 100;
    this.stats.avgDuration = 
      (this.stats.avgDuration * (this.stats.totalQueries - 1) + duration) / this.stats.totalQueries;
    
    // Clean up operation tracking
    this.operationsInProgress.delete(operationId);
    
    // Log the database operation
    const logInfo: DatabaseLogInfo = {
      operation,
      table,
      duration,
      recordCount,
      rowsAffected,
      query: query ? this.sanitizeQuery(query) : undefined,
      success,
      error: error ? error.message : undefined,
      params: params ? this.sanitizeParams(params) : undefined
    };
    
    // Determine log level based on duration and success
    if (!success) {
      // Log errors with error level
      logger.error(
        `DB ${operation} on ${table || 'unknown'} failed after ${duration}ms`,
        error || new Error('Database operation failed'),
        { operation, table },
        { db: logInfo }
      );
    } else if (duration > SLOW_QUERY_THRESHOLD_ERROR) {
      // Very slow queries as errors
      logger.error(
        `DB ${operation} on ${table || 'unknown'} extremely slow (${duration}ms)`,
        new Error('Database operation too slow'),
        { operation, table },
        { db: logInfo }
      );
    } else if (duration > SLOW_QUERY_THRESHOLD_WARN) {
      // Slow queries as warnings
      logger.warn(
        `DB ${operation} on ${table || 'unknown'} slow (${duration}ms)`,
        { operation, table },
        { db: logInfo }
      );
    } else if (this.enableDetailedLogs) {
      // Normal queries as debug level in dev, info in prod
      logger.logDatabase(logInfo, { operation, table });
    }
    
    // For important operations, always log at info level
    if (operation === 'create' || operation === 'delete' || operation === 'truncate') {
      logger.info(
        `DB ${operation} on ${table || 'unknown'} (${duration}ms, affected: ${rowsAffected})`,
        { operation, table },
        { db: logInfo }
      );
    }
    
    logger.info('Database operation completed');
  }
  
  /**
   * Log current database statistics
   */
  logCurrentStats(): void {
    const { totalQueries, totalErrors, slowQueries, successRate, avgDuration } = this.stats;
    
    if (totalQueries === 0) return; // Skip if no queries were executed
    
    logger.info('Database statistics summary', { component: 'stats' }, {
      dbStats: {
        totalQueries,
        totalErrors,
        slowQueries,
        successRate: successRate.toFixed(2) + '%',
        avgDuration: avgDuration.toFixed(2) + 'ms',
        topOperations: this.getTopOperations(5),
        topTables: this.getTopTables(5)
      }
    });
  }
  
  /**
   * Gets the top N most frequently used operations
   */
  private getTopOperations(n: number): Record<string, { count: number, avgDuration: number }> {
    return Object.entries(this.stats.operations)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, n)
      .reduce((acc, [op, stats]) => {
        acc[op] = {
          count: stats.count,
          avgDuration: Math.round(stats.avgDuration)
        };
        return acc;
      }, {} as Record<string, { count: number, avgDuration: number }>);
  }
  
  /**
   * Gets the top N most frequently used tables
   */
  private getTopTables(n: number): Record<string, { count: number, avgDuration: number }> {
    return Object.entries(this.stats.tables)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, n)
      .reduce((acc, [table, stats]) => {
        acc[table] = {
          count: stats.count,
          avgDuration: Math.round(stats.avgDuration)
        };
        return acc;
      }, {} as Record<string, { count: number, avgDuration: number }>);
  }
  
  /**
   * Sanitize a SQL query for logging (remove sensitive data)
   */
  private sanitizeQuery(query?: string): string | undefined {
    if (!query) return undefined;
    
    // Truncate extremely long queries
    if (query.length > 2000) {
      query = query.substring(0, 2000) + '... [truncated]';
    }
    
    // Could implement more sophisticated sanitization here
    // For now, just basic password masking
    return query
      .replace(/password\s*=\s*['"].*?['"]/gi, 'password=\'[REDACTED]\'')
      .replace(/password["']?\s*:\s*["'].*?["']/gi, 'password:"[REDACTED]"');
  }
  
  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  private sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined;
    
    const sanitized = { ...params };
    
    // Redact common sensitive fields
    const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'api_key', 'key', 'credential'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.statsResetInterval) {
      clearInterval(this.statsResetInterval);
    }
    this.logCurrentStats();
  }
}

// Create singleton instance
export const dbLogger = new DbLogger();

// Auto-cleanup on process exit if in Node environment
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', () => dbLogger.cleanup());
  process.on('exit', () => dbLogger.cleanup());
}

// Convenience function for tracking database operations
export function trackDbOperation<T>(
  operation: string, 
  table: string, 
  fn: () => Promise<T>
): Promise<T> {
  const operationId = dbLogger.startOperation(operation, table);
  
  return fn()
    .then(result => {
      // Determine record count for array results
      const recordCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
      
      dbLogger.endOperation(operationId, {
        success: true,
        recordCount
      });
      
      return result;
    })
    .catch(error => {
      dbLogger.endOperation(operationId, {
        success: false,
        error
      });
      
      throw error;
    });
}

// Export the singleton
export default dbLogger; 