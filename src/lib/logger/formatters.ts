import { LogEntry, LogLevel, LogContext } from './types';
import { getChoreoConfig } from './config';

export class LogFormatter {
  private static readonly PII_PATTERNS = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, // SSN patterns
    /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g, // Phone numbers
  ];

  private static readonly SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'key', 'authorization', 'cookie',
    'session', 'csrf', 'api_key', 'access_token', 'refresh_token'
  ];

  static formatJSON(entry: LogEntry, sanitizePII: boolean = true): string {
    const choreoConfig = getChoreoConfig();
    
    const formattedEntry = {
      '@timestamp': entry.timestamp,
      level: LogLevel[entry.level],
      message: sanitizePII ? this.sanitizeString(entry.message) : entry.message,
      service: {
        name: choreoConfig.serviceName,
        version: choreoConfig.version,
        environment: choreoConfig.environment,
        region: choreoConfig.region,
        instance: choreoConfig.instanceId
      },
      context: sanitizePII ? this.sanitizeObject(entry.context) : entry.context,
      metadata: entry.metadata ? (sanitizePII ? this.sanitizeObject(entry.metadata) : entry.metadata) : undefined,
      error: entry.error,
      performance: entry.performance,
      security: entry.security,
      trace: {
        id: entry.context.traceId || entry.context.correlationId,
        correlation_id: entry.context.correlationId
      }
    };

    return JSON.stringify(formattedEntry, null, 0);
  }

  static formatText(entry: LogEntry, sanitizePII: boolean = true): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const message = sanitizePII ? this.sanitizeString(entry.message) : entry.message;
    const correlationId = entry.context.correlationId ? `[${entry.context.correlationId}]` : '';
    
    let output = `${timestamp} ${level} ${correlationId} ${message}`;
    
    if (entry.context.userId) {
      output += ` | User: ${entry.context.userId}`;
    }
    
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    if (entry.performance?.duration) {
      output += ` | Duration: ${entry.performance.duration}ms`;
    }
    
    return output;
  }

  static formatChoreo(entry: LogEntry): string {
    const choreoConfig = getChoreoConfig();
    
    const baseFields: Record<string, any> = {
      correlation_id: entry.context.correlationId,
      user_id: entry.context.userId,
      session_id: entry.context.sessionId,
      request_id: entry.context.requestId,
      trace_id: entry.context.traceId
    };

    const choreoEntry = {
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      message: this.sanitizeString(entry.message),
      labels: {
        service: choreoConfig.serviceName,
        version: choreoConfig.version,
        environment: choreoConfig.environment,
        region: choreoConfig.region,
        instance: choreoConfig.instanceId
      },
      fields: baseFields,
      tags: this.extractTags(entry)
    };

    // Add specialized fields based on log type
    if (entry.error) {
      choreoEntry.fields = {
        ...choreoEntry.fields,
        error_name: entry.error.name,
        error_code: entry.error.code,
        status_code: entry.error.statusCode
      };
      choreoEntry.tags.push('error');
    }

    if (entry.performance) {
      choreoEntry.fields = {
        ...choreoEntry.fields,
        duration_ms: entry.performance.duration,
        memory_used: entry.performance.memoryUsage?.heapUsed,
        cpu_usage: entry.performance.cpuUsage?.user
      };
      choreoEntry.tags.push('performance');
    }

    if (entry.security) {
      choreoEntry.fields = {
        ...choreoEntry.fields,
        security_event: entry.security.event,
        security_severity: entry.security.severity,
        threat_level: entry.security.threatLevel
      };
      choreoEntry.tags.push('security');
    }

    return JSON.stringify(choreoEntry);
  }

  private static sanitizeString(str: string): string {
    let sanitized = str;
    
    this.PII_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (this.SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }

  private static extractTags(entry: LogEntry): string[] {
    const tags: string[] = [];
    
    // Add level-based tags
    if (entry.level >= LogLevel.ERROR) {
      tags.push('alert');
    }
    
    // Add context-based tags
    if (entry.context.userId) {
      tags.push('authenticated');
    }
    
    if (entry.metadata) {
      // Add metadata-based tags
      if (entry.metadata.apiEndpoint) {
        tags.push('api');
      }
      if (entry.metadata.database) {
        tags.push('database');
      }
      if (entry.metadata.authentication) {
        tags.push('auth');
      }
    }
    
    return tags;
  }

  static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static enrichContext(baseContext: Partial<LogContext>, additionalContext?: Partial<LogContext>): LogContext {
    return {
      correlationId: baseContext.correlationId || this.generateCorrelationId(),
      environment: process.env.NODE_ENV || 'development',
      service: 'lumo-inventory',
      version: process.env.npm_package_version || '1.0.0',
      ...baseContext,
      ...additionalContext
    };
  }
} 