import { LogLevel, LoggerConfig } from './types';
import { z } from 'zod';

const LoggerConfigSchema = z.object({
  level: z.nativeEnum(LogLevel),
  enableConsole: z.boolean(),
  enableFile: z.boolean(),
  enableChoreo: z.boolean(),
  maxFileSize: z.number().positive(),
  maxFiles: z.number().positive(),
  filePath: z.string(),
  format: z.enum(['json', 'text']),
  includeStackTrace: z.boolean(),
  sanitizePII: z.boolean(),
  bufferSize: z.number().positive(),
  flushInterval: z.number().positive()
});

export function getLoggerConfig(): LoggerConfig {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true';

  const config: LoggerConfig = {
    level: getLogLevel(),
    enableConsole: !isProduction || process.env.ENABLE_CONSOLE_LOGS === 'true',
    enableFile: process.env.ENABLE_FILE_LOGS !== 'false',
    enableChoreo: isChoreo,
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    filePath: process.env.LOG_FILE_PATH || './logs/application.log',
    format: process.env.LOG_FORMAT === 'text' ? 'text' : 'json',
    includeStackTrace: !isProduction || process.env.INCLUDE_STACK_TRACE === 'true',
    sanitizePII: process.env.SANITIZE_PII !== 'false',
    bufferSize: parseInt(process.env.LOG_BUFFER_SIZE || '100'),
    flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL || '1000')
  };

  // Validate configuration
  try {
    LoggerConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid logger configuration:', error);
    throw new Error('Logger configuration validation failed');
  }

  return config;
}

function getLogLevel(): LogLevel {
  const levelString = process.env.LOG_LEVEL?.toUpperCase();
  
  switch (levelString) {
    case 'TRACE': return LogLevel.TRACE;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'FATAL': return LogLevel.FATAL;
    default:
      // Default log levels by environment
      if (process.env.NODE_ENV === 'production') {
        return LogLevel.INFO;
      } else if (process.env.NODE_ENV === 'test') {
        return LogLevel.WARN;
      } else {
        return LogLevel.DEBUG;
      }
  }
}

export function validateConfig(config: Partial<LoggerConfig>): boolean {
  try {
    LoggerConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

export function getChoreoConfig() {
  return {
    serviceName: process.env.CHOREO_SERVICE_NAME || 'lumo-inventory',
    version: process.env.CHOREO_VERSION || process.env.npm_package_version || '1.0.0',
    environment: process.env.CHOREO_ENVIRONMENT || process.env.NODE_ENV || 'development',
    region: process.env.CHOREO_REGION || 'default',
    instanceId: process.env.CHOREO_INSTANCE_ID || process.env.HOSTNAME || 'local'
  };
}

export const DEFAULT_CONTEXT = {
  service: 'lumo-inventory',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development'
}; 