// Choreo Debug Logger - Excessive logging for deployment debugging
// This logger captures everything happening during Choreo deployment

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category: string;
  message: string;
  metadata?: any;
  environment?: string;
  deploymentId?: string;
  stage?: string;
}

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

class ChoreoDebugLogger {
  private logFile: string;
  private performanceFile: string;
  private errorFile: string;
  private deploymentId: string;
  private startTime: number;
  private performanceMetrics: Map<string, PerformanceMetric>;

  constructor() {
    this.deploymentId = this.generateDeploymentId();
    this.startTime = Date.now();
    this.performanceMetrics = new Map();
    
    // Ensure logs directory exists
    const logsDir = '/tmp/choreo-debug-logs';
    if (!existsSync(logsDir)) {
      try {
        mkdirSync(logsDir, { recursive: true });
      } catch (e) {
        console.error('Failed to create logs directory:', e);
      }
    }

    this.logFile = join(logsDir, `deployment-${this.deploymentId}.log`);
    this.performanceFile = join(logsDir, `performance-${this.deploymentId}.log`);
    this.errorFile = join(logsDir, `errors-${this.deploymentId}.log`);

    // Initialize log files
    this.initializeLogFiles();
    
    // Log deployment start
    this.info('CHOREO_DEPLOYMENT', 'Deployment logging initialized', {
      deploymentId: this.deploymentId,
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo()
    });
  }

  private generateDeploymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  private initializeLogFiles(): void {
    const header = `
=============================================================================
CHOREO DEPLOYMENT DEBUG LOG
=============================================================================
Deployment ID: ${this.deploymentId}
Start Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'unknown'}
Platform: ${process.platform}
Architecture: ${process.arch}
Node Version: ${process.version}
=============================================================================

`;

    try {
      writeFileSync(this.logFile, header);
      writeFileSync(this.performanceFile, header);
      writeFileSync(this.errorFile, header);
    } catch (e) {
      console.error('Failed to initialize log files:', e);
    }
  }

  private getEnvironmentInfo(): any {
    return {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      cwd: process.cwd(),
      execPath: process.execPath,
      argv: process.argv,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT_SET',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET (hidden)' : 'NOT_SET',
        LUMO_IMPORT_MAX_FILE_SIZE: process.env.LUMO_IMPORT_MAX_FILE_SIZE,
        LUMO_IMPORT_BATCH_SIZE: process.env.LUMO_IMPORT_BATCH_SIZE,
        LUMO_IMPORT_TIMEOUT: process.env.LUMO_IMPORT_TIMEOUT,
        LUMO_LOG_LEVEL: process.env.LUMO_LOG_LEVEL,
        PORT: process.env.PORT,
        HOSTNAME: process.env.HOSTNAME,
        PWD: process.env.PWD,
        WORKDIR: process.env.WORKDIR
      }
    };
  }

  private writeToFile(file: string, entry: LogEntry): void {
    const logLine = `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`;
    const metadataLine = entry.metadata ? `\nMETADATA: ${JSON.stringify(entry.metadata, null, 2)}` : '';
    const fullLine = `${logLine}${metadataLine}\n`;

    try {
      appendFileSync(file, fullLine);
    } catch (e) {
      console.error('Failed to write to log file:', e);
    }

    // Also write to console for immediate feedback
    console.log(logLine);
    if (entry.metadata) {
      console.log('METADATA:', entry.metadata);
    }
  }

  public trace(category: string, message: string, metadata?: any): void {
    this.log('TRACE', category, message, metadata);
  }

  public debug(category: string, message: string, metadata?: any): void {
    this.log('DEBUG', category, message, metadata);
  }

  public info(category: string, message: string, metadata?: any): void {
    this.log('INFO', category, message, metadata);
  }

  public warn(category: string, message: string, metadata?: any): void {
    this.log('WARN', category, message, metadata);
  }

  public error(category: string, message: string, metadata?: any): void {
    this.log('ERROR', category, message, metadata);
    this.writeToFile(this.errorFile, this.createLogEntry('ERROR', category, message, metadata));
  }

  public fatal(category: string, message: string, metadata?: any): void {
    this.log('FATAL', category, message, metadata);
    this.writeToFile(this.errorFile, this.createLogEntry('FATAL', category, message, metadata));
  }

  private log(level: LogEntry['level'], category: string, message: string, metadata?: any): void {
    const entry = this.createLogEntry(level, category, message, metadata);
    this.writeToFile(this.logFile, entry);
  }

  private createLogEntry(level: LogEntry['level'], category: string, message: string, metadata?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      environment: process.env.NODE_ENV,
      deploymentId: this.deploymentId,
      stage: process.env.DEPLOYMENT_STAGE || 'unknown'
    };
  }

  public startPerformanceTimer(operation: string): void {
    this.performanceMetrics.set(operation, {
      operation,
      startTime: Date.now()
    });
    this.debug('PERFORMANCE', `Started operation: ${operation}`);
  }

  public endPerformanceTimer(operation: string, success: boolean = true, error?: string): void {
    const metric = this.performanceMetrics.get(operation);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;

      const performanceLog = {
        operation: metric.operation,
        duration: metric.duration,
        success: metric.success,
        error: metric.error,
        timestamp: new Date().toISOString()
      };

      this.debug('PERFORMANCE', `Completed operation: ${operation} in ${metric.duration}ms`, performanceLog);
      
      try {
        appendFileSync(this.performanceFile, JSON.stringify(performanceLog) + '\n');
      } catch (e) {
        console.error('Failed to write to performance file:', e);
      }

      this.performanceMetrics.delete(operation);
    }
  }

  public logSystemStatus(): void {
    const status = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      loadavg: require('os').loadavg(),
      freemem: require('os').freemem(),
      totalmem: require('os').totalmem(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };

    this.info('SYSTEM_STATUS', 'Current system status', status);
  }

  public logDeploymentSummary(): void {
    const summary = {
      deploymentId: this.deploymentId,
      totalDuration: Date.now() - this.startTime,
      pendingOperations: Array.from(this.performanceMetrics.keys()),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    this.info('DEPLOYMENT_SUMMARY', 'Deployment summary', summary);
  }
}

// Export singleton instance
export const choreoLogger = new ChoreoDebugLogger();
export type { LogEntry, PerformanceMetric };
export { ChoreoDebugLogger }; 