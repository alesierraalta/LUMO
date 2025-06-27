import { LogLevel } from './types';
import { getCorrelationContext } from './correlation';
import { PerformanceMetric, MetricType, performanceMetrics } from './performance-metrics';
import { automatedErrorDetection, AlertType, AlertPriority, NotificationChannel } from './automated-error-detection';

/**
 * Threshold monitoring strategies
 */
export enum ThresholdStrategy {
  STATIC = 'STATIC',           // Fixed thresholds
  DYNAMIC = 'DYNAMIC',         // Adaptive based on historical data
  PERCENTILE = 'PERCENTILE',   // Based on percentile analysis
  TREND = 'TREND'              // Based on trend analysis
}

/**
 * Threshold violation severity
 */
export enum ViolationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

/**
 * Threshold monitoring status
 */
export enum MonitoringStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED'
}

/**
 * Advanced threshold configuration
 */
export interface AdvancedThreshold {
  id: string;
  metricType: MetricType;
  metricName: string;
  strategy: ThresholdStrategy;
  status: MonitoringStatus;
  
  // Static thresholds
  staticThresholds?: {
    warning: number;
    critical: number;
    emergency?: number;
    unit: string;
  };
  
  // Dynamic thresholds
  dynamicConfig?: {
    baselineWindow: number; // hours
    adaptationRate: number; // 0-1
  };
  
  // Percentile-based thresholds
  percentileConfig?: {
    warningPercentile: number;
    criticalPercentile: number;
    windowSize: number;
  };
  
  // Alert configuration
  alertConfig: {
    enabled: boolean;
    cooldownPeriod: number;
    notificationChannels: NotificationChannel[];
  };
  
  metadata: {
    description: string;
    owner: string;
    tags: string[];
    createdAt: string;
    lastModified: string;
  };
}

/**
 * Threshold violation event
 */
export interface ThresholdViolation {
  id: string;
  thresholdId: string;
  metric: PerformanceMetric;
  severity: ViolationSeverity;
  violationType: 'threshold_exceeded' | 'trend_violation' | 'anomaly_detected';
  
  violation: {
    currentValue: number;
    thresholdValue: number;
    deviationPercentage: number;
  };
  
  context: {
    correlationId?: string;
    traceId?: string;
    requestPath?: string;
    userId?: string;
  };
  
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  
  timestamp: string;
  resolvedAt?: string;
}

/**
 * Performance threshold monitoring engine
 */
export class PerformanceThresholdMonitor {
  private thresholds: Map<string, AdvancedThreshold> = new Map();
  private violations: Map<string, ThresholdViolation[]> = new Map();
  private metricHistory: Map<string, PerformanceMetric[]> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isActive = false;
  
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor() {
    this.initializeDefaultThresholds();
  }

  /**
   * Start threshold monitoring
   */
  start(intervalMs: number = 15000): void {
    if (this.isActive) {
      this.stop();
    }

    this.isActive = true;
    this.monitoringInterval = setInterval(() => {
      this.runThresholdAnalysis();
    }, intervalMs);

    console.log(`📊 Performance Threshold Monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop threshold monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isActive = false;
    console.log('📊 Performance Threshold Monitoring stopped');
  }

  /**
   * Add threshold configuration
   */
  addThreshold(threshold: AdvancedThreshold): void {
    threshold.metadata.lastModified = new Date().toISOString();
    this.thresholds.set(threshold.id, threshold);
    console.log(`📊 Threshold added: ${threshold.metricName} (${threshold.strategy})`);
  }

  /**
   * Process performance metric for threshold monitoring
   */
  processMetric(metric: PerformanceMetric): void {
    this.storeMetricHistory(metric);
    
    const relevantThresholds = this.getRelevantThresholds(metric);
    
    for (const threshold of relevantThresholds) {
      if (threshold.status === MonitoringStatus.ACTIVE) {
        this.evaluateThreshold(threshold, metric);
      }
    }
  }

  /**
   * Get active violations
   */
  getActiveViolations(): ThresholdViolation[] {
    const allViolations: ThresholdViolation[] = [];
    for (const violations of this.violations.values()) {
      allViolations.push(...violations.filter(v => !v.resolvedAt));
    }
    return allViolations.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Store metric in history
   */
  private storeMetricHistory(metric: PerformanceMetric): void {
    const key = `${metric.type}:${metric.name}`;
    
    if (!this.metricHistory.has(key)) {
      this.metricHistory.set(key, []);
    }
    
    const history = this.metricHistory.get(key)!;
    history.push(metric);
    
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(0, history.length - this.MAX_HISTORY_SIZE);
    }
  }

  /**
   * Get relevant thresholds for metric
   */
  private getRelevantThresholds(metric: PerformanceMetric): AdvancedThreshold[] {
    return Array.from(this.thresholds.values()).filter(threshold => {
      return threshold.metricType === metric.type && 
             (threshold.metricName === '*' || threshold.metricName === metric.name);
    });
  }

  /**
   * Evaluate threshold against metric
   */
  private evaluateThreshold(threshold: AdvancedThreshold, metric: PerformanceMetric): void {
    let violation: ThresholdViolation | null = null;
    
    switch (threshold.strategy) {
      case ThresholdStrategy.STATIC:
        violation = this.evaluateStaticThreshold(threshold, metric);
        break;
        
      case ThresholdStrategy.DYNAMIC:
        violation = this.evaluateDynamicThreshold(threshold, metric);
        break;
        
      case ThresholdStrategy.PERCENTILE:
        violation = this.evaluatePercentileThreshold(threshold, metric);
        break;
        
      default:
        console.warn(`Unknown threshold strategy: ${threshold.strategy}`);
    }
    
    if (violation) {
      this.recordViolation(violation);
      
      if (threshold.alertConfig.enabled) {
        this.triggerAlert(violation, threshold);
      }
    }
  }

  /**
   * Evaluate static threshold
   */
  private evaluateStaticThreshold(threshold: AdvancedThreshold, metric: PerformanceMetric): ThresholdViolation | null {
    if (!threshold.staticThresholds) return null;
    
    const { warning, critical, emergency } = threshold.staticThresholds;
    let severity: ViolationSeverity | null = null;
    let thresholdValue = 0;
    
    if (emergency && metric.value >= emergency) {
      severity = ViolationSeverity.EMERGENCY;
      thresholdValue = emergency;
    } else if (metric.value >= critical) {
      severity = ViolationSeverity.CRITICAL;
      thresholdValue = critical;
    } else if (metric.value >= warning) {
      severity = ViolationSeverity.WARNING;
      thresholdValue = warning;
    }
    
    if (severity) {
      return this.createViolation(threshold, metric, severity, thresholdValue);
    }
    
    return null;
  }

  /**
   * Evaluate dynamic threshold
   */
  private evaluateDynamicThreshold(threshold: AdvancedThreshold, metric: PerformanceMetric): ThresholdViolation | null {
    const key = `${metric.type}:${metric.name}`;
    const history = this.metricHistory.get(key) || [];
    
    if (history.length < 10) return null; // Need sufficient data
    
    const values = history.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    const warningThreshold = mean + (2 * stdDev);
    const criticalThreshold = mean + (3 * stdDev);
    
    let severity: ViolationSeverity | null = null;
    let thresholdValue = 0;
    
    if (metric.value >= criticalThreshold) {
      severity = ViolationSeverity.CRITICAL;
      thresholdValue = criticalThreshold;
    } else if (metric.value >= warningThreshold) {
      severity = ViolationSeverity.WARNING;
      thresholdValue = warningThreshold;
    }
    
    if (severity) {
      return this.createViolation(threshold, metric, severity, thresholdValue);
    }
    
    return null;
  }

  /**
   * Evaluate percentile threshold
   */
  private evaluatePercentileThreshold(threshold: AdvancedThreshold, metric: PerformanceMetric): ThresholdViolation | null {
    if (!threshold.percentileConfig) return null;
    
    const key = `${metric.type}:${metric.name}`;
    const history = this.metricHistory.get(key) || [];
    
    if (history.length < threshold.percentileConfig.windowSize) return null;
    
    const recentHistory = history.slice(-threshold.percentileConfig.windowSize);
    const values = recentHistory.map(m => m.value).sort((a, b) => a - b);
    
    const warningThreshold = this.calculatePercentile(values, threshold.percentileConfig.warningPercentile);
    const criticalThreshold = this.calculatePercentile(values, threshold.percentileConfig.criticalPercentile);
    
    let severity: ViolationSeverity | null = null;
    let thresholdValue = 0;
    
    if (metric.value >= criticalThreshold) {
      severity = ViolationSeverity.CRITICAL;
      thresholdValue = criticalThreshold;
    } else if (metric.value >= warningThreshold) {
      severity = ViolationSeverity.WARNING;
      thresholdValue = warningThreshold;
    }
    
    if (severity) {
      return this.createViolation(threshold, metric, severity, thresholdValue);
    }
    
    return null;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Create violation object
   */
  private createViolation(
    threshold: AdvancedThreshold,
    metric: PerformanceMetric,
    severity: ViolationSeverity,
    thresholdValue: number
  ): ThresholdViolation {
    const correlationContext = getCorrelationContext();
    
    return {
      id: this.generateViolationId(),
      thresholdId: threshold.id,
      metric,
      severity,
      violationType: 'threshold_exceeded',
      violation: {
        currentValue: metric.value,
        thresholdValue,
        deviationPercentage: ((metric.value - thresholdValue) / thresholdValue) * 100
      },
      context: {
        correlationId: correlationContext?.correlationId || metric.correlationId,
        traceId: correlationContext?.traceId || metric.traceId,
        requestPath: metric.context?.requestPath,
        userId: metric.context?.userId
      },
      recommendations: this.generateRecommendations(metric, threshold, severity),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metric: PerformanceMetric,
    threshold: AdvancedThreshold,
    severity: ViolationSeverity
  ): ThresholdViolation['recommendations'] {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };
    
    switch (metric.type) {
      case MetricType.REQUEST_DURATION:
        recommendations.immediate.push('Check for slow database queries or external API calls');
        recommendations.shortTerm.push('Optimize request processing logic');
        recommendations.longTerm.push('Implement caching strategy');
        break;
        
      case MetricType.DATABASE_QUERY:
        recommendations.immediate.push('Check database server status and connections');
        recommendations.shortTerm.push('Analyze and optimize slow queries');
        recommendations.longTerm.push('Consider database scaling or indexing');
        break;
        
      case MetricType.MEMORY_USAGE:
        recommendations.immediate.push('Check for memory leaks');
        recommendations.shortTerm.push('Optimize memory usage patterns');
        recommendations.longTerm.push('Scale memory resources');
        break;
    }
    
    if (severity === ViolationSeverity.EMERGENCY || severity === ViolationSeverity.CRITICAL) {
      recommendations.immediate.unshift('IMMEDIATE ACTION REQUIRED');
    }
    
    return recommendations;
  }

  /**
   * Record violation
   */
  private recordViolation(violation: ThresholdViolation): void {
    if (!this.violations.has(violation.thresholdId)) {
      this.violations.set(violation.thresholdId, []);
    }
    
    this.violations.get(violation.thresholdId)!.push(violation);
    
    const logEntry = {
      timestamp: violation.timestamp,
      level: violation.severity === ViolationSeverity.EMERGENCY ? LogLevel.ERROR : LogLevel.WARN,
      message: `📊 Threshold Violation: ${violation.metric.name} = ${violation.violation.currentValue}${violation.metric.unit}`,
      context: {
        correlationId: violation.context.correlationId,
        traceId: violation.context.traceId,
        service: 'lumo-inventory',
        violationId: violation.id
      },
      metadata: {
        thresholdViolation: violation,
        alertType: 'threshold_monitoring'
      }
    };
    
    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Trigger alert
   */
  private triggerAlert(violation: ThresholdViolation, threshold: AdvancedThreshold): void {
    const alertPriority = this.mapSeverityToAlertPriority(violation.severity);
    
    const detectionRule = {
      id: `threshold_${threshold.id}`,
      name: `Threshold Violation: ${threshold.metricName}`,
      type: AlertType.THRESHOLD_BREACH,
      priority: alertPriority,
      enabled: true,
      conditions: {},
      actions: {
        immediate: violation.recommendations.immediate,
        investigation: violation.recommendations.shortTerm,
        resolution: violation.recommendations.longTerm
      },
      notifications: threshold.alertConfig.notificationChannels,
      cooldown: threshold.alertConfig.cooldownPeriod
    };
    
    automatedErrorDetection.addRule(detectionRule);
  }

  /**
   * Map severity to alert priority
   */
  private mapSeverityToAlertPriority(severity: ViolationSeverity): AlertPriority {
    switch (severity) {
      case ViolationSeverity.INFO: return AlertPriority.LOW;
      case ViolationSeverity.WARNING: return AlertPriority.MEDIUM;
      case ViolationSeverity.CRITICAL: return AlertPriority.HIGH;
      case ViolationSeverity.EMERGENCY: return AlertPriority.EMERGENCY;
      default: return AlertPriority.MEDIUM;
    }
  }

  /**
   * Run threshold analysis
   */
  private runThresholdAnalysis(): void {
    try {
      const report = performanceMetrics.generateReport();
      
      Object.entries(report.metrics).forEach(([key, aggregation]) => {
        const [type, name] = key.split(':');
        const metricType = type as MetricType;
        
        const syntheticMetric: PerformanceMetric = {
          id: `analysis_${Date.now()}`,
          type: metricType,
          name,
          value: aggregation.avg,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          tags: { source: 'threshold_analysis' }
        };
        
        this.processMetric(syntheticMetric);
      });
      
    } catch (error) {
      console.error('Error in threshold analysis:', error);
    }
  }

  /**
   * Initialize default thresholds
   */
  private initializeDefaultThresholds(): void {
    // Request duration threshold
    this.addThreshold({
      id: 'request_duration_static',
      metricType: MetricType.REQUEST_DURATION,
      metricName: '*',
      strategy: ThresholdStrategy.STATIC,
      status: MonitoringStatus.ACTIVE,
      staticThresholds: {
        warning: 1000,
        critical: 3000,
        emergency: 10000,
        unit: 'ms'
      },
      alertConfig: {
        enabled: true,
        cooldownPeriod: 300,
        notificationChannels: [NotificationChannel.CONSOLE, NotificationChannel.CHOREO_LOGS]
      },
      metadata: {
        description: 'Static thresholds for request duration monitoring',
        owner: 'system',
        tags: ['performance', 'requests'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    // Database query threshold
    this.addThreshold({
      id: 'database_query_dynamic',
      metricType: MetricType.DATABASE_QUERY,
      metricName: '*',
      strategy: ThresholdStrategy.DYNAMIC,
      status: MonitoringStatus.ACTIVE,
      dynamicConfig: {
        baselineWindow: 24,
        adaptationRate: 0.1
      },
      alertConfig: {
        enabled: true,
        cooldownPeriod: 180,
        notificationChannels: [NotificationChannel.CONSOLE, NotificationChannel.CHOREO_LOGS]
      },
      metadata: {
        description: 'Dynamic thresholds for database query performance',
        owner: 'system',
        tags: ['performance', 'database'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });
  }

  /**
   * Generate violation ID
   */
  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStatistics(): {
    isActive: boolean;
    totalThresholds: number;
    activeThresholds: number;
    totalViolations: number;
    activeViolations: number;
  } {
    const thresholds = Array.from(this.thresholds.values());
    const activeViolations = this.getActiveViolations();
    
    let totalViolations = 0;
    for (const violations of this.violations.values()) {
      totalViolations += violations.length;
    }
    
    return {
      isActive: this.isActive,
      totalThresholds: thresholds.length,
      activeThresholds: thresholds.filter(t => t.status === MonitoringStatus.ACTIVE).length,
      totalViolations,
      activeViolations: activeViolations.length
    };
  }

  /**
   * Get all thresholds
   */
  getThresholds(): AdvancedThreshold[] {
    return Array.from(this.thresholds.values());
  }
}

/**
 * Global performance threshold monitor
 */
export const performanceThresholdMonitor = new PerformanceThresholdMonitor();

/**
 * Integration utilities
 */
export const ThresholdMonitoringIntegration = {
  /**
   * Initialize threshold monitoring
   */
  initialize(intervalMs: number = 15000): void {
    performanceThresholdMonitor.start(intervalMs);
  },

  /**
   * Process performance metric
   */
  processMetric(metric: PerformanceMetric): void {
    performanceThresholdMonitor.processMetric(metric);
  },

  /**
   * Get monitoring status
   */
  getStatus(): {
    isActive: boolean;
    totalThresholds: number;
    activeViolations: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const stats = performanceThresholdMonitor.getMonitoringStatistics();
    const activeViolations = performanceThresholdMonitor.getActiveViolations();
    
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (activeViolations.some(v => v.severity === ViolationSeverity.EMERGENCY)) {
      systemHealth = 'critical';
    } else if (activeViolations.some(v => v.severity === ViolationSeverity.CRITICAL)) {
      systemHealth = 'critical';
    } else if (activeViolations.length > 0) {
      systemHealth = 'warning';
    }
    
    return {
      isActive: stats.isActive,
      totalThresholds: stats.totalThresholds,
      activeViolations: stats.activeViolations,
      systemHealth
    };
  },

  /**
   * Add custom threshold
   */
  addThreshold(threshold: AdvancedThreshold): void {
    performanceThresholdMonitor.addThreshold(threshold);
  },

  /**
   * Get active violations
   */
  getActiveViolations(): ThresholdViolation[] {
    return performanceThresholdMonitor.getActiveViolations();
  }
};