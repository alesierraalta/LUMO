import { LogLevel } from './types';
import { getCorrelationContext } from './correlation';
import { ErrorClassification, ErrorCategory, ErrorSeverity, errorCategorizationEngine } from './error-categorization';
import { PerformanceMetric, MetricType, performanceMetrics } from './performance-metrics';

/**
 * Alert types for different detection scenarios
 */
export enum AlertType {
  ERROR_SPIKE = 'ERROR_SPIKE',
  ERROR_PATTERN = 'ERROR_PATTERN',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  SYSTEM_FAILURE = 'SYSTEM_FAILURE',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  THRESHOLD_BREACH = 'THRESHOLD_BREACH',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  CORRELATION_ALERT = 'CORRELATION_ALERT'
}

/**
 * Alert priority levels
 */
export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

/**
 * Alert status tracking
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  SUPPRESSED = 'SUPPRESSED'
}

/**
 * Alert notification channels
 */
export enum NotificationChannel {
  CONSOLE = 'CONSOLE',
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
  CHOREO_LOGS = 'CHOREO_LOGS'
}

/**
 * Comprehensive alert interface
 */
export interface AutomatedAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  description: string;
  timestamp: string;
  correlationId?: string;
  traceId?: string;
  source: {
    component: string;
    operation: string;
    requestPath?: string;
    userId?: string;
  };
  triggers: {
    errorClassification?: ErrorClassification;
    performanceMetric?: PerformanceMetric;
    thresholdBreach?: {
      metric: string;
      current: number;
      threshold: number;
      unit: string;
    };
    pattern?: {
      name: string;
      frequency: number;
      timeWindow: string;
    };
  };
  actions: {
    immediate: string[];
    investigation: string[];
    resolution: string[];
  };
  metadata: {
    detectionMethod: string;
    confidence: number;
    affectedUsers: number;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    estimatedDowntime?: string;
  };
  notifications: {
    channels: NotificationChannel[];
    sentAt?: string;
    acknowledged?: {
      by: string;
      at: string;
      notes?: string;
    };
    resolved?: {
      by: string;
      at: string;
      resolution: string;
    };
  };
}

/**
 * Detection rules for automated alerting
 */
interface DetectionRule {
  id: string;
  name: string;
  type: AlertType;
  priority: AlertPriority;
  enabled: boolean;
  conditions: {
    errorCategory?: ErrorCategory[];
    errorSeverity?: ErrorSeverity[];
    metricType?: MetricType[];
    threshold?: {
      value: number;
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      timeWindow: number; // seconds
    };
    frequency?: {
      count: number;
      timeWindow: number; // seconds
    };
    pattern?: RegExp[];
  };
  actions: {
    immediate: string[];
    investigation: string[];
    resolution: string[];
  };
  notifications: NotificationChannel[];
  cooldown: number; // seconds to prevent alert spam
}

/**
 * Automated error detection and alerting engine
 */
export class AutomatedErrorDetectionEngine {
  private rules: Map<string, DetectionRule> = new Map();
  private alertHistory: Map<string, AutomatedAlert[]> = new Map();
  private ruleCooldowns: Map<string, number> = new Map();
  private isActive = false;
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * Start automated error detection
   */
  start(intervalMs: number = 30000): void {
    if (this.isActive) {
      this.stop();
    }

    this.isActive = true;
    this.monitoringInterval = setInterval(() => {
      this.runDetection();
    }, intervalMs);

    console.log(`🔍 Automated Error Detection started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automated error detection
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isActive = false;
    console.log('🔍 Automated Error Detection stopped');
  }

  /**
   * Add detection rule
   */
  addRule(rule: DetectionRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Process error for automated detection
   */
  processError(error: Error, classification: ErrorClassification): void {
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled);
    
    for (const rule of enabledRules) {
      if (this.evaluateErrorRule(rule, classification)) {
        this.generateAlert(rule, { errorClassification: classification });
      }
    }
  }

  /**
   * Process performance metric for automated detection
   */
  processPerformanceMetric(metric: PerformanceMetric): void {
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled);
    
    for (const rule of enabledRules) {
      if (this.evaluatePerformanceRule(rule, metric)) {
        this.generateAlert(rule, { performanceMetric: metric });
      }
    }
  }

  /**
   * Run periodic detection analysis
   */
  private runDetection(): void {
    try {
      // Get recent error statistics
      const errorStats = errorCategorizationEngine.getErrorStatistics();
      
      // Get performance report
      const performanceReport = performanceMetrics.generateReport();
      
      // Check for anomalies and patterns
      this.detectAnomalies(errorStats, performanceReport);
      
    } catch (error) {
      console.error('Error in automated detection:', error);
    }
  }

  /**
   * Evaluate if error matches rule conditions
   */
  private evaluateErrorRule(rule: DetectionRule, classification: ErrorClassification): boolean {
    // Check error category
    if (rule.conditions.errorCategory && 
        !rule.conditions.errorCategory.includes(classification.category)) {
      return false;
    }

    // Check error severity
    if (rule.conditions.errorSeverity && 
        !rule.conditions.errorSeverity.includes(classification.severity)) {
      return false;
    }

    // Check cooldown
    if (this.isInCooldown(rule.id, rule.cooldown)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate if performance metric matches rule conditions
   */
  private evaluatePerformanceRule(rule: DetectionRule, metric: PerformanceMetric): boolean {
    // Check metric type
    if (rule.conditions.metricType && 
        !rule.conditions.metricType.includes(metric.type)) {
      return false;
    }

    // Check threshold conditions
    if (rule.conditions.threshold) {
      const { value, operator } = rule.conditions.threshold;
      
      switch (operator) {
        case '>': if (!(metric.value > value)) return false; break;
        case '<': if (!(metric.value < value)) return false; break;
        case '>=': if (!(metric.value >= value)) return false; break;
        case '<=': if (!(metric.value <= value)) return false; break;
        case '==': if (!(metric.value === value)) return false; break;
        case '!=': if (!(metric.value !== value)) return false; break;
      }
    }

    // Check cooldown
    if (this.isInCooldown(rule.id, rule.cooldown)) {
      return false;
    }

    return true;
  }

  /**
   * Generate alert from rule and triggers
   */
  private generateAlert(
    rule: DetectionRule, 
    triggers: AutomatedAlert['triggers']
  ): void {
    const correlationContext = getCorrelationContext();
    
    const alert: AutomatedAlert = {
      id: this.generateAlertId(),
      type: rule.type,
      priority: rule.priority,
      status: AlertStatus.ACTIVE,
      title: rule.name,
      message: this.generateAlertMessage(rule, triggers),
      description: this.generateAlertDescription(rule, triggers),
      timestamp: new Date().toISOString(),
      correlationId: correlationContext?.correlationId,
      traceId: correlationContext?.traceId,
      source: {
        component: 'automated-detection-engine',
        operation: 'rule-evaluation',
        requestPath: triggers.performanceMetric?.context?.requestPath,
        userId: triggers.performanceMetric?.context?.userId
      },
      triggers,
      actions: rule.actions,
      metadata: {
        detectionMethod: 'rule-based',
        confidence: this.calculateConfidence(rule, triggers),
        affectedUsers: this.estimateAffectedUsers(triggers),
        impactLevel: this.assessImpactLevel(rule.priority),
        estimatedDowntime: this.estimateDowntime(rule.type, rule.priority)
      },
      notifications: {
        channels: rule.notifications
      }
    };

    // Record and send alert
    this.recordAlert(alert, rule.id);
    this.sendAlert(alert);
  }

  /**
   * Send alert through configured channels
   */
  private sendAlert(alert: AutomatedAlert): void {
    const logEntry = {
      timestamp: alert.timestamp,
      level: alert.priority === AlertPriority.EMERGENCY || alert.priority === AlertPriority.CRITICAL 
        ? LogLevel.ERROR : LogLevel.WARN,
      message: `🚨 AUTOMATED ALERT: ${alert.title}`,
      context: {
        correlationId: alert.correlationId,
        traceId: alert.traceId,
        service: 'lumo-inventory',
        alertId: alert.id
      },
      metadata: {
        automatedAlert: alert,
        alertType: 'automated_detection'
      }
    };

    // Always log to console
    console.error(JSON.stringify(logEntry, null, 2));

    // Mark as sent
    alert.notifications.sentAt = new Date().toISOString();
  }

  /**
   * Record alert with cooldown tracking
   */
  private recordAlert(alert: AutomatedAlert, ruleId: string): void {
    if (!this.alertHistory.has(alert.type)) {
      this.alertHistory.set(alert.type, []);
    }
    this.alertHistory.get(alert.type)!.push(alert);
    this.ruleCooldowns.set(ruleId, Date.now());
  }

  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(ruleId: string, cooldownSeconds: number): boolean {
    const lastAlert = this.ruleCooldowns.get(ruleId);
    if (!lastAlert) return false;
    
    const now = Date.now();
    return (now - lastAlert) < (cooldownSeconds * 1000);
  }

  /**
   * Detect anomalies in system behavior
   */
  private detectAnomalies(errorStats: any, performanceReport: any): void {
    // Check for unusual error spikes
    const totalErrors = errorStats.totalErrors;
    if (totalErrors > 50) {
      console.warn(`🔍 Anomaly detected: High error count (${totalErrors})`);
    }

    // Check system health
    if (performanceReport.summary.systemHealth === 'critical') {
      console.error('🔍 Anomaly detected: System health critical');
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: DetectionRule, triggers: AutomatedAlert['triggers']): string {
    if (triggers.errorClassification) {
      return `${rule.name}: ${triggers.errorClassification.category} error detected`;
    }
    
    if (triggers.performanceMetric) {
      return `${rule.name}: ${triggers.performanceMetric.name} = ${triggers.performanceMetric.value}${triggers.performanceMetric.unit}`;
    }

    return rule.name;
  }

  /**
   * Generate alert description
   */
  private generateAlertDescription(rule: DetectionRule, triggers: AutomatedAlert['triggers']): string {
    let description = `Automated detection rule "${rule.name}" triggered. `;
    
    if (triggers.errorClassification) {
      description += `Error: ${triggers.errorClassification.category} (${triggers.errorClassification.severity})`;
    }
    
    if (triggers.performanceMetric) {
      description += `Performance metric: ${triggers.performanceMetric.name} = ${triggers.performanceMetric.value}${triggers.performanceMetric.unit}`;
    }

    return description;
  }

  /**
   * Calculate alert confidence
   */
  private calculateConfidence(rule: DetectionRule, triggers: AutomatedAlert['triggers']): number {
    if (triggers.errorClassification) {
      return triggers.errorClassification.confidence;
    }
    return 0.8;
  }

  /**
   * Estimate affected users
   */
  private estimateAffectedUsers(triggers: AutomatedAlert['triggers']): number {
    if (triggers.errorClassification) {
      return triggers.errorClassification.metadata.affectedUsers;
    }
    return 0;
  }

  /**
   * Assess impact level
   */
  private assessImpactLevel(priority: AlertPriority): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority) {
      case AlertPriority.LOW: return 'low';
      case AlertPriority.MEDIUM: return 'medium';
      case AlertPriority.HIGH: return 'high';
      case AlertPriority.CRITICAL:
      case AlertPriority.EMERGENCY: return 'critical';
      default: return 'medium';
    }
  }

  /**
   * Estimate downtime
   */
  private estimateDowntime(type: AlertType, priority: AlertPriority): string | undefined {
    if (type === AlertType.SYSTEM_FAILURE && priority === AlertPriority.EMERGENCY) {
      return '< 5 minutes';
    }
    
    if (priority === AlertPriority.CRITICAL) {
      return '< 15 minutes';
    }
    
    return undefined;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    alertsByType: Record<string, number>;
  } {
    const allAlerts: AutomatedAlert[] = [];
    for (const alerts of this.alertHistory.values()) {
      allAlerts.push(...alerts);
    }

    const activeAlerts = allAlerts.filter(alert => alert.status === AlertStatus.ACTIVE);
    
    const alertsByType: Record<string, number> = {};
    allAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
    });

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      alertsByType
    };
  }

  /**
   * Get detection rules
   */
  getRules(): DetectionRule[] {
    return Array.from(this.rules.values());
  }
}

/**
 * Global automated error detection engine
 */
export const automatedErrorDetection = new AutomatedErrorDetectionEngine();

/**
 * Integration utilities
 */
export const ErrorDetectionIntegration = {
  /**
   * Initialize automated error detection
   */
  initialize(intervalMs: number = 30000): void {
    automatedErrorDetection.start(intervalMs);
  },

  /**
   * Process error through detection engine
   */
  processError(error: Error, classification: ErrorClassification): void {
    automatedErrorDetection.processError(error, classification);
  },

  /**
   * Process performance metric through detection engine
   */
  processPerformanceMetric(metric: PerformanceMetric): void {
    automatedErrorDetection.processPerformanceMetric(metric);
  },

  /**
   * Get current detection status
   */
  getStatus(): {
    isActive: boolean;
    totalRules: number;
    totalAlerts: number;
    activeAlerts: number;
  } {
    const rules = automatedErrorDetection.getRules();
    const stats = automatedErrorDetection.getAlertStatistics();
    
    return {
      isActive: automatedErrorDetection['isActive'],
      totalRules: rules.length,
      totalAlerts: stats.totalAlerts,
      activeAlerts: stats.activeAlerts
    };
  }
};