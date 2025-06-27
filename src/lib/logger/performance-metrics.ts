import { LogLevel } from './types';
import { getCorrelationContext, createTimer } from './correlation';

/**
 * Performance metric types for comprehensive monitoring
 */
export enum MetricType {
  REQUEST_DURATION = 'REQUEST_DURATION',
  DATABASE_QUERY = 'DATABASE_QUERY',
  API_CALL = 'API_CALL',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  CACHE_HIT_RATE = 'CACHE_HIT_RATE',
  ERROR_RATE = 'ERROR_RATE',
  THROUGHPUT = 'THROUGHPUT',
  RESPONSE_SIZE = 'RESPONSE_SIZE',
  CUSTOM = 'CUSTOM'
}

/**
 * Performance threshold definitions
 */
export interface PerformanceThresholds {
  warning: number;
  critical: number;
  unit: string;
}

/**
 * Performance metric data structure
 */
export interface PerformanceMetric {
  id: string;
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  tags: Record<string, string>;
  thresholds?: PerformanceThresholds;
  context?: {
    operation?: string;
    component?: string;
    feature?: string;
    userId?: string;
    requestPath?: string;
  };
}

/**
 * Performance alert severity levels
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

/**
 * Performance alert interface
 */
export interface PerformanceAlert {
  id: string;
  severity: AlertSeverity;
  metric: PerformanceMetric;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

/**
 * Performance metrics aggregation
 */
export interface MetricsAggregation {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  sum: number;
  stdDev: number;
}

/**
 * Performance metrics collector
 */
export class PerformanceMetricsCollector {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private aggregations: Map<string, MetricsAggregation> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Default thresholds for common metrics
  private defaultThresholds: Record<MetricType, PerformanceThresholds> = {
    [MetricType.REQUEST_DURATION]: { warning: 1000, critical: 5000, unit: 'ms' },
    [MetricType.DATABASE_QUERY]: { warning: 500, critical: 2000, unit: 'ms' },
    [MetricType.API_CALL]: { warning: 2000, critical: 10000, unit: 'ms' },
    [MetricType.MEMORY_USAGE]: { warning: 80, critical: 95, unit: '%' },
    [MetricType.CPU_USAGE]: { warning: 70, critical: 90, unit: '%' },
    [MetricType.CACHE_HIT_RATE]: { warning: 70, critical: 50, unit: '%' },
    [MetricType.ERROR_RATE]: { warning: 5, critical: 10, unit: '%' },
    [MetricType.THROUGHPUT]: { warning: 100, critical: 50, unit: 'req/min' },
    [MetricType.RESPONSE_SIZE]: { warning: 1048576, critical: 5242880, unit: 'bytes' },
    [MetricType.CUSTOM]: { warning: 100, critical: 200, unit: 'units' }
  };

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'correlationId' | 'traceId' | 'spanId'>): PerformanceMetric {
    const correlationContext = getCorrelationContext();
    
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateMetricId(),
      timestamp: new Date().toISOString(),
      correlationId: correlationContext?.correlationId,
      traceId: correlationContext?.traceId,
      spanId: correlationContext?.spanId,
      thresholds: metric.thresholds || this.defaultThresholds[metric.type]
    };

    // Store metric
    const key = `${metric.type}:${metric.name}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(fullMetric);

    // Check thresholds and generate alerts
    this.checkThresholds(fullMetric);

    // Update aggregations
    this.updateAggregations(key);

    // Log metric if significant
    this.logMetric(fullMetric);

    return fullMetric;
  }

  /**
   * Record request duration with automatic correlation
   */
  recordRequestDuration(
    duration: number,
    requestPath: string,
    method: string,
    statusCode: number,
    tags: Record<string, string> = {}
  ): PerformanceMetric {
    return this.recordMetric({
      type: MetricType.REQUEST_DURATION,
      name: `${method} ${requestPath}`,
      value: duration,
      unit: 'ms',
      tags: {
        ...tags,
        method,
        path: requestPath,
        statusCode: statusCode.toString()
      },
      context: {
        operation: 'http_request',
        requestPath
      }
    });
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(
    duration: number,
    operation: string,
    table?: string,
    recordCount?: number,
    tags: Record<string, string> = {}
  ): PerformanceMetric {
    return this.recordMetric({
      type: MetricType.DATABASE_QUERY,
      name: `${operation}${table ? ` on ${table}` : ''}`,
      value: duration,
      unit: 'ms',
      tags: {
        ...tags,
        operation,
        table: table || 'unknown',
        recordCount: recordCount?.toString() || 'unknown'
      },
      context: {
        operation: 'database_query',
        component: 'database'
      }
    });
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(): void {
    if (typeof process !== 'undefined') {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.recordMetric({
        type: MetricType.MEMORY_USAGE,
        name: 'heap_used',
        value: memUsage.heapUsed,
        unit: 'bytes',
        tags: {
          metric_type: 'system',
          component: 'memory'
        },
        context: {
          operation: 'system_monitoring',
          component: 'memory'
        }
      });

      // CPU usage (if available)
      try {
        const cpuUsage = process.cpuUsage();
        this.recordMetric({
          type: MetricType.CPU_USAGE,
          name: 'cpu_user',
          value: cpuUsage.user,
          unit: 'microseconds',
          tags: {
            metric_type: 'system',
            component: 'cpu'
          },
          context: {
            operation: 'system_monitoring',
            component: 'cpu'
          }
        });
      } catch (error) {
        // CPU usage not available in all environments
      }
    }
  }

  /**
   * Start automatic system metrics collection
   */
  startSystemMetricsCollection(intervalMs: number = 30000): void {
    if (this.intervals.has('system_metrics')) {
      this.stopSystemMetricsCollection();
    }

    const interval = setInterval(() => {
      this.recordSystemMetrics();
    }, intervalMs);

    this.intervals.set('system_metrics', interval);
  }

  /**
   * Stop automatic system metrics collection
   */
  stopSystemMetricsCollection(): void {
    const interval = this.intervals.get('system_metrics');
    if (interval) {
      clearInterval(interval);
      this.intervals.delete('system_metrics');
    }
  }

  /**
   * Check metric thresholds and generate alerts
   */
  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.thresholds) return;

    let severity: AlertSeverity | null = null;
    let threshold: number | null = null;

    if (metric.value >= metric.thresholds.critical) {
      severity = AlertSeverity.CRITICAL;
      threshold = metric.thresholds.critical;
    } else if (metric.value >= metric.thresholds.warning) {
      severity = AlertSeverity.WARNING;
      threshold = metric.thresholds.warning;
    }

    if (severity && threshold !== null) {
      const alert: PerformanceAlert = {
        id: this.generateAlertId(),
        severity,
        metric,
        threshold,
        message: `${metric.name} (${metric.value}${metric.unit}) exceeded ${severity.toLowerCase()} threshold (${threshold}${metric.unit})`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      this.alerts.push(alert);
      this.logAlert(alert);
    }
  }

  /**
   * Update metric aggregations
   */
  private updateAggregations(key: string): void {
    const metrics = this.metrics.get(key) || [];
    if (metrics.length === 0) return;

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;

    // Calculate percentiles
    const p50 = this.percentile(values, 0.5);
    const p90 = this.percentile(values, 0.9);
    const p95 = this.percentile(values, 0.95);
    const p99 = this.percentile(values, 0.99);

    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const aggregation: MetricsAggregation = {
      count,
      min: values[0],
      max: values[count - 1],
      avg,
      p50,
      p90,
      p95,
      p99,
      sum,
      stdDev
    };

    this.aggregations.set(key, aggregation);
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const index = (values.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= values.length) return values[lower];
    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Log significant metrics
   */
  private logMetric(metric: PerformanceMetric): void {
    const shouldLog = metric.thresholds && 
      (metric.value >= metric.thresholds.warning || 
       metric.tags.log_always === 'true');

    if (shouldLog) {
      const logEntry = {
        timestamp: metric.timestamp,
        level: metric.value >= (metric.thresholds?.critical || Infinity) ? LogLevel.ERROR : LogLevel.WARN,
        message: `Performance metric: ${metric.name} = ${metric.value}${metric.unit}`,
        context: {
          correlationId: metric.correlationId,
          traceId: metric.traceId,
          spanId: metric.spanId,
          service: 'lumo-inventory'
        },
        metadata: {
          performanceMetric: metric,
          metricType: 'performance'
        }
      };

      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log performance alerts
   */
  private logAlert(alert: PerformanceAlert): void {
    const logEntry = {
      timestamp: alert.timestamp,
      level: alert.severity === AlertSeverity.CRITICAL ? LogLevel.ERROR : LogLevel.WARN,
      message: `Performance Alert: ${alert.message}`,
      context: {
        correlationId: alert.metric.correlationId,
        traceId: alert.metric.traceId,
        spanId: alert.metric.spanId,
        service: 'lumo-inventory'
      },
      metadata: {
        performanceAlert: alert,
        metricType: 'performance_alert'
      }
    };

    console.error(JSON.stringify(logEntry));
  }

  /**
   * Generate metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalMetrics: number;
      activeAlerts: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
    };
    metrics: Record<string, MetricsAggregation>;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt);
    const systemHealth = activeAlerts.some(a => a.severity === AlertSeverity.CRITICAL) ? 'critical'
      : activeAlerts.some(a => a.severity === AlertSeverity.WARNING) ? 'warning'
      : 'healthy';

    const recommendations: string[] = [];
    
    if (systemHealth === 'critical') {
      recommendations.push('Immediate action required - critical performance issues detected');
    }
    
    if (activeAlerts.length > 5) {
      recommendations.push('High number of active alerts - review system capacity');
    }

    return {
      summary: {
        totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
        activeAlerts: activeAlerts.length,
        systemHealth
      },
      metrics: Object.fromEntries(this.aggregations.entries()),
      alerts: activeAlerts,
      recommendations
    };
  }
}

/**
 * Global performance metrics collector instance
 */
export const performanceMetrics = new PerformanceMetricsCollector();

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    fn: () => Promise<T>,
    metricName: string,
    type: MetricType = MetricType.CUSTOM,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const timer = createTimer(metricName);
    
    try {
      const result = await fn();
      const { duration } = timer.end();
      
      performanceMetrics.recordMetric({
        type,
        name: metricName,
        value: duration,
        unit: 'ms',
        tags: { ...tags, success: 'true' }
      });
      
      return result;
    } catch (error) {
      const { duration } = timer.end();
      
      performanceMetrics.recordMetric({
        type,
        name: metricName,
        value: duration,
        unit: 'ms',
        tags: { ...tags, success: 'false', error: 'true' }
      });
      
      throw error;
    }
  },

  /**
   * Start automatic system monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    performanceMetrics.startSystemMetricsCollection(intervalMs);
  },

  /**
   * Stop automatic system monitoring
   */
  stopMonitoring(): void {
    performanceMetrics.stopSystemMetricsCollection();
  },

  /**
   * Get current performance status
   */
  getStatus(): {
    health: 'healthy' | 'warning' | 'critical';
    activeAlerts: number;
    totalMetrics: number;
  } {
    const report = performanceMetrics.generateReport();
    return {
      health: report.summary.systemHealth,
      activeAlerts: report.summary.activeAlerts,
      totalMetrics: report.summary.totalMetrics
    };
  }
};
