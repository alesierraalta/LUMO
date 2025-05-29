import { 
  Logger, 
  LogLevel, 
  LogEntry, 
  LogContext, 
  APILogInfo, 
  DatabaseLogInfo, 
  AuthLogInfo, 
  PerformanceInfo, 
  SecurityInfo 
} from './types';
import { getLoggerConfig, DEFAULT_CONTEXT } from './config';
import { LogFormatter } from './formatters';
import { ConsoleTransport, FileTransport, ChoreoTransport, BufferedTransport } from './transports';

class LumoLogger implements Logger {
  private transport!: BufferedTransport;
  private config = getLoggerConfig();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const transports = [];

    if (this.config.enableConsole) {
      transports.push(new ConsoleTransport(this.config));
    }

    if (this.config.enableFile) {
      transports.push(new FileTransport(this.config));
    }

    if (this.config.enableChoreo) {
      transports.push(new ChoreoTransport(this.config));
    }

    this.transport = new BufferedTransport(transports);
    this.isInitialized = true;

    // Log initialization
    this.info('Logger initialized', { service: 'logger' }, {
      config: {
        level: LogLevel[this.config.level],
        enableConsole: this.config.enableConsole,
        enableFile: this.config.enableFile,
        enableChoreo: this.config.enableChoreo
      }
    });

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('exit', () => this.shutdown());
  }

  private async shutdown(): Promise<void> {
    if (this.transport) {
      await this.transport.flush();
      await this.transport.close();
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Partial<LogContext>,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const enrichedContext = LogFormatter.enrichContext(DEFAULT_CONTEXT, context);
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: enrichedContext,
      metadata
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
        cause: (error as any).cause
      };
    }

    return entry;
  }

  private async log(entry: LogEntry): Promise<void> {
    if (!this.isInitialized || entry.level < this.config.level) {
      return;
    }

    try {
      await this.transport.write(entry);
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  trace(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.TRACE, message, context, metadata);
    this.log(entry);
  }

  debug(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.log(entry);
  }

  info(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    this.log(entry);
  }

  warn(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
    this.log(entry);
  }

  error(message: string, error?: Error, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, metadata, error);
    this.log(entry);
  }

  fatal(message: string, error?: Error, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, metadata, error);
    this.log(entry);
  }

  logAPI(info: APILogInfo, context?: Partial<LogContext>): void {
    const message = `${info.method} ${info.path} - ${info.statusCode} (${info.duration}ms)`;
    const metadata = {
      apiEndpoint: true,
      api: info
    };
    
    const level = info.statusCode >= 500 ? LogLevel.ERROR 
                : info.statusCode >= 400 ? LogLevel.WARN 
                : LogLevel.INFO;

    const entry = this.createLogEntry(level, message, context, metadata);
    this.log(entry);
  }

  logDatabase(info: DatabaseLogInfo, context?: Partial<LogContext>): void {
    const message = `DB ${info.operation} on ${info.table || 'unknown'} (${info.duration}ms)`;
    const metadata = {
      database: true,
      db: info
    };
    
    const level = info.duration > 1000 ? LogLevel.WARN 
                : info.duration > 100 ? LogLevel.INFO 
                : LogLevel.DEBUG;

    const entry = this.createLogEntry(level, message, context, metadata);
    this.log(entry);
  }

  logAuth(info: AuthLogInfo, context?: Partial<LogContext>): void {
    const message = `Auth ${info.event} for user ${info.userId || 'unknown'} - ${info.success ? 'Success' : 'Failed'}`;
    const metadata = {
      authentication: true,
      auth: info
    };
    
    const level = !info.success ? LogLevel.WARN : LogLevel.INFO;

    const entry = this.createLogEntry(level, message, context, metadata);
    this.log(entry);
  }

  logPerformance(info: PerformanceInfo, context?: Partial<LogContext>): void {
    const message = `Performance metrics recorded`;
    const metadata = {
      performance: true
    };

    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    entry.performance = info;
    this.log(entry);
  }

  logSecurity(info: SecurityInfo, context?: Partial<LogContext>): void {
    const message = `Security event: ${info.event} (${info.severity})`;
    const metadata = {
      security: true
    };
    
    const level = info.severity === 'critical' ? LogLevel.FATAL
                : info.severity === 'high' ? LogLevel.ERROR
                : info.severity === 'medium' ? LogLevel.WARN
                : LogLevel.INFO;

    const entry = this.createLogEntry(level, message, context, metadata);
    entry.security = info;
    this.log(entry);
  }

  // Health check method
  async getHealth(): Promise<{ status: string; config: any; timestamp: string }> {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      config: {
        level: LogLevel[this.config.level],
        transports: {
          console: this.config.enableConsole,
          file: this.config.enableFile,
          choreo: this.config.enableChoreo
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  // Manual flush method
  async flush(): Promise<void> {
    if (this.transport) {
      await this.transport.flush();
    }
  }
}

// Global logger instance
const logger = new LumoLogger();

// Export both the class and the instance
export { LumoLogger, logger };
export default logger;

// Convenience exports
export * from './types';
export { LogFormatter } from './formatters';
export { getLoggerConfig } from './config'; 