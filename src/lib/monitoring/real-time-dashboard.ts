/**
 * 📊 REAL-TIME DEBUGGING DASHBOARD
 * Live monitoring dashboard for configuration, startup, and performance tracking
 * Based on critical production failure analysis from 2025-06-29
 */

import { ExtremeConfigMonitor } from './config-monitor';
import { StartupTracker } from './startup-tracker';
import { PredictiveFailureDetector } from './predictive-detector';

interface DashboardMetrics {
  timestamp: string;
  configurationStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  startupPhase: string;
  environmentVariables: Record<string, boolean>;
  buildIdStatus: boolean;
  predictiveAlerts: number;
  uptime: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

interface AlertMessage {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  source: 'CONFIG' | 'STARTUP' | 'PREDICTIVE' | 'PERFORMANCE';
  details?: any;
}

export class RealTimeDashboard {
  private static instance: RealTimeDashboard;
  private configMonitor: ExtremeConfigMonitor;
  private startupTracker: StartupTracker;
  private predictiveDetector: PredictiveFailureDetector;
  private alerts: AlertMessage[] = [];
  private metrics: DashboardMetrics[] = [];
  private dashboardInterval: NodeJS.Timeout | null = null;
  private startTime: number;

  static getInstance(): RealTimeDashboard {
    if (!RealTimeDashboard.instance) {
      RealTimeDashboard.instance = new RealTimeDashboard();
    }
    return RealTimeDashboard.instance;
  }

  constructor() {
    this.configMonitor = ExtremeConfigMonitor.getInstance();
    this.startupTracker = StartupTracker.getInstance();
    this.predictiveDetector = PredictiveFailureDetector.getInstance();
    this.startTime = Date.now();

    console.log('📊 [REAL-TIME DASHBOARD] Initializing extreme debugging dashboard...');
    this.initializeDashboard();
  }

  /**
   * Initialize the real-time dashboard
   */
  private initializeDashboard(): void {
    this.addAlert('INFO', 'Real-time debugging dashboard initialized', 'CONFIG');
    this.startMetricsCollection();
    this.displayDashboardHeader();
  }

  /**
   * Start collecting metrics every 5 seconds
   */
  private startMetricsCollection(): void {
    this.dashboardInterval = setInterval(() => {
      this.collectMetrics();
      this.updateDashboard();
    }, 5000);

    console.log('📊 [REAL-TIME DASHBOARD] Metrics collection started (5s intervals)');
  }

  /**
   * Collect current system metrics
   */
  private collectMetrics(): void {
    const configValidation = this.configMonitor.validateConfiguration();
    const startupSummary = this.startupTracker.getStartupSummary();
    
    // Check required environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const envVarStatus: Record<string, boolean> = {};
    requiredVars.forEach(varName => {
      envVarStatus[varName] = !!process.env[varName];
    });

    // Determine configuration status
    let configStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (!configValidation.isValid) {
      configStatus = configValidation.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
    }

    // Run predictive analysis
    const currentState = {
      configValidation,
      startupSummary,
      environmentVariables: envVarStatus,
      uptime: Date.now() - this.startTime
    };

    const predictivePatterns = this.predictiveDetector.analyzeForPotentialFailures(currentState);
    
    if (predictivePatterns.length > 0) {
      this.predictiveDetector.generatePredictiveAlerts(predictivePatterns);
      predictivePatterns.forEach(pattern => {
        this.addAlert(
          pattern.severity as 'CRITICAL' | 'WARNING',
          `Predictive Alert: ${pattern.pattern}`,
          'PREDICTIVE',
          { probability: pattern.probability, recommendations: pattern.recommendations }
        );
      });
    }

    const metrics: DashboardMetrics = {
      timestamp: new Date().toISOString(),
      configurationStatus: configStatus,
      startupPhase: startupSummary.status,
      environmentVariables: envVarStatus,
      buildIdStatus: configValidation.buildIdStatus,
      predictiveAlerts: predictivePatterns.length,
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage()
    };

    this.metrics.push(metrics);

    // Keep only last 100 metrics entries
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Update dashboard display
   */
  private updateDashboard(): void {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    console.log('\n📊 ═══════════════════════════════════════════════════════════════');
    console.log('📊 LUMO EXTREME DEBUGGING DASHBOARD - REAL-TIME STATUS');
    console.log('📊 ═══════════════════════════════════════════════════════════════');
    
    // Configuration Status
    const configIcon = latest.configurationStatus === 'HEALTHY' ? '✅' : 
                      latest.configurationStatus === 'WARNING' ? '⚠️' : '🚨';
    console.log(`🔧 Configuration: ${configIcon} ${latest.configurationStatus}`);
    
    // Environment Variables Status
    console.log('🌍 Environment Variables:');
    Object.entries(latest.environmentVariables).forEach(([varName, isPresent]) => {
      const icon = isPresent ? '✅' : '❌';
      console.log(`   ${icon} ${varName}`);
    });

    // BUILD_ID Status
    const buildIcon = latest.buildIdStatus ? '✅' : '❌';
    console.log(`🏗️  BUILD_ID: ${buildIcon} ${latest.buildIdStatus ? 'Present' : 'Missing'}`);

    // Startup Status
    console.log(`🚀 Startup Phase: ${latest.startupPhase}`);

    // Predictive Alerts
    if (latest.predictiveAlerts > 0) {
      console.log(`🔮 Predictive Alerts: 🚨 ${latest.predictiveAlerts} potential issues detected`);
    } else {
      console.log(`🔮 Predictive Alerts: ✅ No issues predicted`);
    }

    // System Metrics
    console.log(`⏱️  Uptime: ${Math.floor(latest.uptime / 1000)}s`);
    
    if (latest.memoryUsage) {
      const memMB = Math.round(latest.memoryUsage.heapUsed / 1024 / 1024);
      console.log(`💾 Memory: ${memMB}MB`);
    }

    // Recent Alerts
    const recentAlerts = this.alerts.slice(-3);
    if (recentAlerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      recentAlerts.forEach(alert => {
        const icon = alert.severity === 'CRITICAL' ? '🚨' : 
                    alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${alert.source}] ${alert.message}`);
      });
    }

    console.log('📊 ═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Display dashboard header
   */
  private displayDashboardHeader(): void {
    console.log('\n🚨 ═══════════════════════════════════════════════════════════════');
    console.log('🚨 LUMO EXTREME DEBUGGING SYSTEM - INITIALIZED');
    console.log('🚨 ═══════════════════════════════════════════════════════════════');
    console.log('🎯 Monitoring: Configuration, Startup, Predictive Failures');
    console.log('📊 Based on: Critical production failure analysis (2025-06-29)');
    console.log('⚡ Features: Real-time monitoring, automated root cause analysis');
    console.log('🚨 ═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Add alert to the dashboard
   */
  private addAlert(severity: 'INFO' | 'WARNING' | 'CRITICAL', message: string, source: 'CONFIG' | 'STARTUP' | 'PREDICTIVE' | 'PERFORMANCE', details?: any): void {
    const alert: AlertMessage = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity,
      message,
      source,
      details
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    const icon = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [DASHBOARD ALERT] [${source}] ${message}`);
  }

  /**
   * Get dashboard metrics for API endpoints
   */
  getDashboardData(): any {
    const latest = this.metrics[this.metrics.length - 1];
    return {
      currentMetrics: latest,
      recentMetrics: this.metrics.slice(-10),
      recentAlerts: this.alerts.slice(-10),
      summary: {
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.severity === 'CRITICAL').length,
        uptime: latest?.uptime || 0,
        configurationHealth: latest?.configurationStatus || 'UNKNOWN'
      }
    };
  }

  /**
   * Stop dashboard monitoring
   */
  stopDashboard(): void {
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
      this.dashboardInterval = null;
      console.log('📊 [REAL-TIME DASHBOARD] Dashboard monitoring stopped');
    }
  }

  /**
   * Export dashboard data for analysis
   */
  exportDashboardData(): string {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getDashboardData().summary
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Auto-initialize dashboard if in server environment
if (typeof window === 'undefined') {
  const dashboard = RealTimeDashboard.getInstance();
  console.log('📊 [REAL-TIME DASHBOARD] Auto-initialized for server environment');
} 