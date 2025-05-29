import { PrismaClient } from '@prisma/client';
import { dbLogger } from './logger';
import logger from '../logger';

// Extended Prisma client with logging capabilities
class EnhancedPrismaClient extends PrismaClient {
  private operationCounter = 0;
  
  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Only setup in Node.js environment (not Edge Runtime)
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      this.setupEventListeners();
      this.setupQueryMiddleware();
    }
  }

  private setupEventListeners(): void {
    // Query logging
    this.$on('query', (e: any) => {
      const duration = e.duration;
      const query = e.query;
      const params = e.params;
      
      logger.debug('Prisma query executed', undefined, {
        database: {
          query: this.sanitizeQuery(query),
          params: this.sanitizeParams(params),
          duration,
          timestamp: e.timestamp
        }
      });

      // Log slow queries
      if (duration > 100) {
        dbLogger.logSlowQuery(query, duration);
      }
    });

    // Error logging
    this.$on('error', (e: any) => {
      logger.error('Prisma error occurred', new Error(e.message), undefined, {
        database: {
          error: true,
          target: e.target,
          timestamp: e.timestamp
        }
      });
    });

    // Info and warning logging
    this.$on('info', (e: any) => {
      logger.info('Prisma info', undefined, {
        database: {
          info: e.message,
          target: e.target,
          timestamp: e.timestamp
        }
      });
    });

    this.$on('warn', (e: any) => {
      logger.warn('Prisma warning', undefined, {
        database: {
          warning: e.message,
          target: e.target,
          timestamp: e.timestamp
        }
      });
    });
  }

  private setupQueryMiddleware(): void {
    this.$use(async (params: any, next: any) => {
      const operationId = `op_${++this.operationCounter}_${Date.now()}`;
      const startTime = Date.now();
      
      // Extract operation details
      const { model, action } = params;
      const operation = `${action}${model ? `_${model}` : ''}`;
      
      logger.debug(`Database operation starting: ${operation}`, undefined, {
        database: {
          operationId,
          model,
          action,
          startTime: new Date(startTime).toISOString()
        }
      });

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        
        // Determine affected rows count
        let rowsAffected: number | undefined;
        if (Array.isArray(result)) {
          rowsAffected = result.length;
        } else if (result && typeof result === 'object' && 'count' in result) {
          rowsAffected = (result as any).count;
        } else if (result) {
          rowsAffected = 1;
        }

        // Log the operation
        logger.logDatabase({
          operation,
          table: model,
          duration,
          rowsAffected
        });

        logger.debug(`Database operation completed: ${operation}`, undefined, {
          database: {
            operationId,
            model,
            action,
            duration,
            rowsAffected,
            success: true
          }
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(`Database operation failed: ${operation}`, error as Error, undefined, {
          database: {
            operationId,
            model,
            action,
            duration,
            success: false,
            error: (error as Error).message
          }
        });

        throw error;
      }
    });
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from query strings
    let sanitized = query;
    
    // Replace potential password/sensitive fields
    sanitized = sanitized.replace(/password\s*=\s*['"'][^'"]*['"']/gi, "password = '[REDACTED]'");
    sanitized = sanitized.replace(/token\s*=\s*['"'][^'"]*['"']/gi, "token = '[REDACTED]'");
    sanitized = sanitized.replace(/secret\s*=\s*['"'][^'"]*['"']/gi, "secret = '[REDACTED]'");
    
    return sanitized;
  }

  private sanitizeParams(params: string): string {
    try {
      const parsed = JSON.parse(params);
      const sanitized = this.sanitizeObject(parsed);
      return JSON.stringify(sanitized);
    } catch {
      return '[UNPARSEABLE_PARAMS]';
    }
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Check if it looks like sensitive data
      if (obj.length > 20 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
        return '[REDACTED_TOKEN]';
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }

  // Enhanced connection management
  async $connect(): Promise<void> {
    logger.info('Connecting to database');
    try {
      await super.$connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', error as Error);
      throw error;
    }
  }

  async $disconnect(): Promise<void> {
    logger.info('Disconnecting from database');
    try {
      await super.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error while disconnecting from database', error as Error);
      throw error;
    }
  }

  // Health check method
  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    timestamp: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Global enhanced Prisma instance
const prisma = new EnhancedPrismaClient();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection');
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection');
  await prisma.$disconnect();
});

export default prisma;
export { EnhancedPrismaClient }; 