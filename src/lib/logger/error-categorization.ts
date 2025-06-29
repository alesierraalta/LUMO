import { LogLevel } from './types';
import { getCorrelationContext } from './correlation';

/**
 * Error category definitions for intelligent classification
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  CONFIGURATION = 'CONFIGURATION',
  USER_INPUT = 'USER_INPUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels for prioritization
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',     // System down, data loss
  HIGH = 'HIGH',             // Major functionality broken
  MEDIUM = 'MEDIUM',         // Feature degraded
  LOW = 'LOW',               // Minor issues
  INFO = 'INFO'              // Informational
}

/**
 * Error resolution suggestions
 */
export enum ErrorResolution {
  IMMEDIATE_ACTION = 'IMMEDIATE_ACTION',
  INVESTIGATE = 'INVESTIGATE',
  MONITOR = 'MONITOR',
  IGNORE = 'IGNORE',
  ESCALATE = 'ESCALATE'
}

/**
 * Comprehensive error classification result
 */
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  resolution: ErrorResolution;
  confidence: number;
  patterns: string[];
  suggestions: string[];
  relatedErrors: string[];
  rootCause?: string;
  impact: {
    userFacing: boolean;
    dataIntegrity: boolean;
    systemStability: boolean;
    securityRisk: boolean;
  };
  metadata: {
    frequency: number;
    firstSeen: string;
    lastSeen: string;
    affectedUsers: number;
    affectedFeatures: string[];
  };
}

/**
 * Error pattern definitions for automatic detection
 */
interface ErrorPattern {
  name: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  patterns: RegExp[];
  statusCodes?: number[];
  keywords: string[];
  resolution: ErrorResolution;
  suggestions: string[];
  confidence: number;
}

/**
 * Predefined error patterns for classification
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  {
    name: 'Invalid JWT Token',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    patterns: [
      /invalid.*jwt/i,
      /token.*expired/i,
      /malformed.*token/i,
      /jwt.*verification.*failed/i
    ],
    statusCodes: [401],
    keywords: ['jwt', 'token', 'expired', 'invalid', 'authentication'],
    resolution: ErrorResolution.IMMEDIATE_ACTION,
    suggestions: [
      'Check JWT secret configuration',
      'Verify token expiration settings',
      'Validate token signing algorithm'
    ],
    confidence: 0.95
  },
  {
    name: 'Database Connection Failed',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    patterns: [
      /connection.*refused/i,
      /database.*unavailable/i,
      /connection.*timeout/i,
      /pool.*exhausted/i
    ],
    keywords: ['database', 'connection', 'timeout', 'pool', 'refused'],
    resolution: ErrorResolution.IMMEDIATE_ACTION,
    suggestions: [
      'Check database server status',
      'Verify connection pool configuration',
      'Review database resource usage'
    ],
    confidence: 0.95
  }
];

/**
 * Error tracking for pattern analysis
 */
class ErrorTracker {
  private errorHistory: Map<string, ErrorClassification[]> = new Map();
  private patternFrequency: Map<string, number> = new Map();
  private correlationErrors: Map<string, string[]> = new Map();

  addError(errorId: string, classification: ErrorClassification, correlationId?: string): void {
    if (!this.errorHistory.has(errorId)) {
      this.errorHistory.set(errorId, []);
    }
    this.errorHistory.get(errorId)!.push(classification);

    classification.patterns.forEach(pattern => {
      this.patternFrequency.set(pattern, (this.patternFrequency.get(pattern) || 0) + 1);
    });

    if (correlationId) {
      if (!this.correlationErrors.has(correlationId)) {
        this.correlationErrors.set(correlationId, []);
      }
      this.correlationErrors.get(correlationId)!.push(errorId);
    }
  }

  getRelatedErrors(correlationId: string): string[] {
    return this.correlationErrors.get(correlationId) || [];
  }

  getErrorFrequency(pattern: string): number {
    return this.patternFrequency.get(pattern) || 0;
  }

  getTopPatterns(limit = 10): Array<{ pattern: string; frequency: number }> {
    return Array.from(this.patternFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([pattern, frequency]) => ({ pattern, frequency }));
  }
}

/**
 * Enhanced error categorization engine
 */
export class ErrorCategorizationEngine {
  private tracker = new ErrorTracker();
  private customPatterns: ErrorPattern[] = [];

  classifyError(
    error: Error,
    context?: {
      statusCode?: number;
      requestPath?: string;
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, any>;
    }
  ): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const allPatterns = [...ERROR_PATTERNS, ...this.customPatterns];
    
    const matches = allPatterns
      .map(pattern => ({
        pattern,
        score: this.calculateMatchScore(pattern, errorMessage, context?.statusCode)
      }))
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);

    const bestMatch = matches[0];
    const classification = bestMatch 
      ? this.createClassificationFromPattern(bestMatch.pattern, bestMatch.score, error, context)
      : this.createDefaultClassification(error, context);

    const correlationContext = getCorrelationContext();
    if (correlationContext) {
      classification.relatedErrors = this.tracker.getRelatedErrors(correlationContext.correlationId);
    }

    const errorId = this.generateErrorId(error, context);
    this.tracker.addError(errorId, classification, correlationContext?.correlationId);

    return classification;
  }

  private calculateMatchScore(pattern: ErrorPattern, errorMessage: string, statusCode?: number): number {
    let score = 0;

    const patternMatches = pattern.patterns.filter(regex => regex.test(errorMessage)).length;
    score += (patternMatches / pattern.patterns.length) * 40;

    const keywordMatches = pattern.keywords.filter(keyword => errorMessage.includes(keyword)).length;
    score += (keywordMatches / pattern.keywords.length) * 30;

    if (pattern.statusCodes && statusCode && pattern.statusCodes.includes(statusCode)) {
      score += 20;
    }

    score += pattern.confidence * 10;

    return Math.min(score, 100);
  }

  private createClassificationFromPattern(
    pattern: ErrorPattern,
    score: number,
    error: Error,
    context?: any
  ): ErrorClassification {
    const now = new Date().toISOString();
    
    return {
      category: pattern.category,
      severity: pattern.severity,
      resolution: pattern.resolution,
      confidence: Math.min(score / 100, 1),
      patterns: [pattern.name],
      suggestions: pattern.suggestions,
      relatedErrors: [],
      rootCause: this.inferRootCause(pattern),
      impact: this.assessImpact(pattern),
      metadata: {
        frequency: this.tracker.getErrorFrequency(pattern.name),
        firstSeen: now,
        lastSeen: now,
        affectedUsers: context?.userId ? 1 : 0,
        affectedFeatures: context?.requestPath ? [context.requestPath] : []
      }
    };
  }

  private createDefaultClassification(error: Error, context?: any): ErrorClassification {
    const now = new Date().toISOString();
    
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      resolution: ErrorResolution.INVESTIGATE,
      confidence: 0.1,
      patterns: ['Unknown Error Pattern'],
      suggestions: [
        'Review error message and stack trace',
        'Check application logs for context',
        'Consider adding custom error pattern'
      ],
      relatedErrors: [],
      rootCause: 'Unknown - requires investigation',
      impact: {
        userFacing: true,
        dataIntegrity: false,
        systemStability: false,
        securityRisk: false
      },
      metadata: {
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
        affectedUsers: context?.userId ? 1 : 0,
        affectedFeatures: context?.requestPath ? [context.requestPath] : []
      }
    };
  }

  private inferRootCause(pattern: ErrorPattern): string {
    const causes = {
      [ErrorCategory.AUTHENTICATION]: 'Authentication system misconfiguration or invalid credentials',
      [ErrorCategory.DATABASE]: 'Database connectivity or query execution issues',
      [ErrorCategory.VALIDATION]: 'Input validation rules not properly enforced',
      [ErrorCategory.NETWORK]: 'Network connectivity or external service issues',
      [ErrorCategory.PERFORMANCE]: 'Resource constraints or inefficient code execution',
      [ErrorCategory.SECURITY]: 'Security policy violation or potential attack',
      [ErrorCategory.SYSTEM]: 'System resource exhaustion or configuration issues'
    };

    return causes[pattern.category] || 'Root cause requires further investigation';
  }

  private assessImpact(pattern: ErrorPattern): ErrorClassification['impact'] {
    return {
      userFacing: [
        ErrorCategory.AUTHENTICATION,
        ErrorCategory.VALIDATION,
        ErrorCategory.BUSINESS_LOGIC
      ].includes(pattern.category),
      dataIntegrity: [
        ErrorCategory.DATABASE,
        ErrorCategory.VALIDATION
      ].includes(pattern.category),
      systemStability: [
        ErrorCategory.SYSTEM,
        ErrorCategory.PERFORMANCE
      ].includes(pattern.category),
      securityRisk: [
        ErrorCategory.SECURITY,
        ErrorCategory.AUTHENTICATION
      ].includes(pattern.category)
    };
  }

  private generateErrorId(error: Error, context?: any): string {
    const components = [
      error.name,
      error.message.slice(0, 50),
      context?.requestPath || '',
      context?.statusCode || ''
    ];
    
    return btoa(components.join('|')).slice(0, 16);
  }

  addCustomPattern(pattern: ErrorPattern): void {
    this.customPatterns.push(pattern);
  }

  getErrorStatistics(): {
    totalErrors: number;
    topPatterns: Array<{ pattern: string; frequency: number }>;
    categoryDistribution: Record<string, number>;
    severityDistribution: Record<string, number>;
  } {
    const topPatterns = this.tracker.getTopPatterns();
    
    const categoryDistribution: Record<string, number> = {};
    const severityDistribution: Record<string, number> = {};
    
    ERROR_PATTERNS.forEach(pattern => {
      const freq = this.tracker.getErrorFrequency(pattern.name);
      categoryDistribution[pattern.category] = (categoryDistribution[pattern.category] || 0) + freq;
      severityDistribution[pattern.severity] = (severityDistribution[pattern.severity] || 0) + freq;
    });

    return {
      totalErrors: topPatterns.reduce((sum, p) => sum + p.frequency, 0),
      topPatterns,
      categoryDistribution,
      severityDistribution
    };
  }
}

/**
 * Global error categorization engine instance
 */
export const errorCategorizationEngine = new ErrorCategorizationEngine();

/**
 * Enhanced error logging with automatic categorization
 */
export function logCategorizedError(
  error: Error,
  context?: {
    statusCode?: number;
    requestPath?: string;
    userId?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
  }
): ErrorClassification {
  const classification = errorCategorizationEngine.classifyError(error, context);
  const correlationContext = getCorrelationContext();
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    message: `[${classification.category}] ${error.message}`,
    context: {
      correlationId: correlationContext?.correlationId || context?.correlationId,
      traceId: correlationContext?.traceId,
      spanId: correlationContext?.spanId,
      userId: context?.userId,
      requestPath: context?.requestPath,
      service: 'lumo-inventory'
    },
    metadata: {
      errorClassification: classification,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }
  };

  console.error(JSON.stringify(logEntry, null, 2));
  
  return classification;
}
 