export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  environment?: string;
  service?: string;
  version?: string;
  requestId?: string;
  traceId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, any>;
  error?: ErrorInfo;
  performance?: PerformanceInfo;
  security?: SecurityInfo;
}

export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  cause?: string;
}

export interface PerformanceInfo {
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  webVitals?: WebVitalsInfo;
}

export interface WebVitalsInfo {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
}

export interface SecurityInfo {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  userContext?: string;
  threatLevel?: number;
}

export interface DatabaseLogInfo {
  query?: string;
  duration: number;
  rowsAffected?: number;
  recordCount?: number;
  operation: string;
  table?: string;
  connectionId?: string;
  success?: boolean;
  error?: string;
  params?: Record<string, any>;
}

export interface APILogInfo {
  method: string;
  path: string;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
  duration: number;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface AuthLogInfo {
  event: 'login' | 'logout' | 'refresh' | 'failed_attempt' | 'permission_denied';
  userId?: string;
  sessionId?: string;
  provider?: string;
  permissions?: string[];
  roles?: string[];
  success: boolean;
  failureReason?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableChoreo: boolean;
  maxFileSize: number;
  maxFiles: number;
  filePath: string;
  format: 'json' | 'text';
  includeStackTrace: boolean;
  sanitizePII: boolean;
  bufferSize: number;
  flushInterval: number;
}

export interface Logger {
  trace(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  debug(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  info(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  warn(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  fatal(message: string, error?: Error, context?: Partial<LogContext>, metadata?: Record<string, any>): void;
  
  // Specialized logging methods
  logAPI(info: APILogInfo, context?: Partial<LogContext>): void;
  logDatabase(info: DatabaseLogInfo, context?: Partial<LogContext>): void;
  logAuth(info: AuthLogInfo, context?: Partial<LogContext>): void;
  logPerformance(info: PerformanceInfo, context?: Partial<LogContext>): void;
  logSecurity(info: SecurityInfo, context?: Partial<LogContext>): void;
} 