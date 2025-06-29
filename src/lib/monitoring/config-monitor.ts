
/**
 * 🔍 REAL-TIME CONFIGURATION MONITORING
 * Validates environment variables and configuration during startup
 */

import * as path from 'path';
import * as fs from 'fs';

interface ConfigValidationResult {
  isValid: boolean;
  missingVars: string[];
  buildIdStatus: boolean;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

interface EnvironmentDetection {
  isServer: boolean;
  isBuild: boolean;
  hasMissingConfig: boolean;
  NODE_ENV: string;
  NEXT_PHASE?: string;
  BUILD_ID: boolean;
  hasSupabaseUrl: boolean;
}

export class ExtremeConfigMonitor {
  private static instance: ExtremeConfigMonitor;
  private validationHistory: ConfigValidationResult[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): ExtremeConfigMonitor {
    if (!ExtremeConfigMonitor.instance) {
      ExtremeConfigMonitor.instance = new ExtremeConfigMonitor();
    }
    return ExtremeConfigMonitor.instance;
  }

  /**
   * Start real-time monitoring with 1-second intervals during startup
   */
  startExtremeMonitoring(): void {
    console.log('🔍 [EXTREME MONITOR] Starting 1-second interval configuration monitoring...');
    
    let monitoringPhase = 'STARTUP';
    let secondsElapsed = 0;
    
    this.monitoringInterval = setInterval(() => {
      secondsElapsed++;
      const result = this.validateConfiguration();
      
      console.log(`🔍 [EXTREME MONITOR] [${monitoringPhase}] Second ${secondsElapsed}: ${result.isValid ? '✅' : '❌'} Config Status`);
      
      if (!result.isValid) {
        console.error(`🚨 [EXTREME MONITOR] CRITICAL CONFIGURATION ISSUE:`, result);
        this.triggerAutomatedAnalysis(result);
      }
      
      this.validationHistory.push(result);
      
      // Switch to slower monitoring after 30 seconds
      if (secondsElapsed >= 30) {
        monitoringPhase = 'RUNTIME';
        this.switchToRuntimeMonitoring();
      }
    }, 1000);
  }

  /**
   * Validate all critical configuration
   */
  validateConfiguration(): ConfigValidationResult {
    const requiredSupabaseVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredSupabaseVars.filter(varName => !process.env[varName]);
    const buildIdExists = this.checkBuildId();
    
    const environmentDetection: EnvironmentDetection = {
      isServer: typeof window === 'undefined',
      isBuild: process.env.NODE_ENV === 'production' && !!process.env.NEXT_BUILD,
      hasMissingConfig: missingVars.length > 0,
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      NEXT_PHASE: process.env.NEXT_PHASE,
      BUILD_ID: buildIdExists,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    };

    console.log(`🔍 [EXTREME MONITOR] Environment Detection:`, environmentDetection);

    const result: ConfigValidationResult = {
      isValid: missingVars.length === 0 && buildIdExists,
      missingVars,
      buildIdStatus: buildIdExists,
      timestamp: new Date().toISOString(),
      severity: missingVars.length > 0 ? 'CRITICAL' : buildIdExists ? 'INFO' : 'WARNING'
    };

    return result;
  }

  /**
   * Check BUILD_ID file existence and validity
   */
  private checkBuildId(): boolean {
    try {
      const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
      if (fs.existsSync(buildIdPath)) {
        const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
        console.log(`🔍 [EXTREME MONITOR] BUILD_ID found: ${buildId}`);
        return buildId.length > 0;
      } else {
        console.warn(`⚠️ [EXTREME MONITOR] BUILD_ID file not found at: ${buildIdPath}`);
        return false;
      }
    } catch (error) {
      console.error(`🚨 [EXTREME MONITOR] Error checking BUILD_ID:`, error);
      return false;
    }
  }

  /**
   * Trigger automated root cause analysis
   */
  private triggerAutomatedAnalysis(result: ConfigValidationResult): void {
    console.log('🤖 [AUTOMATED ANALYSIS] Triggering root cause analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      issue: 'Configuration Validation Failure',
      rootCauses: [],
      recommendations: []
    };

    if (result.missingVars.length > 0) {
      analysis.rootCauses.push({
        cause: 'Missing Environment Variables',
        variables: result.missingVars,
        impact: 'Application will use fallback clients, degraded functionality'
      });
      
      analysis.recommendations.push({
        action: 'Configure missing environment variables in Choreo console',
        priority: 'CRITICAL',
        variables: result.missingVars
      });
    }

    if (!result.buildIdStatus) {
      analysis.rootCauses.push({
        cause: 'BUILD_ID Missing',
        impact: 'Next.js cannot determine build type, may use development mode'
      });
      
      analysis.recommendations.push({
        action: 'Verify build process generates BUILD_ID file',
        priority: 'HIGH',
        details: 'Check Dockerfile and build scripts'
      });
    }

    console.log('🤖 [AUTOMATED ANALYSIS] Root Cause Analysis:', analysis);
    this.saveAnalysisReport(analysis);
  }

  /**
   * Switch to runtime monitoring (every 30 seconds)
   */
  private switchToRuntimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🔍 [EXTREME MONITOR] Switching to runtime monitoring (30s intervals)...');
    
    this.monitoringInterval = setInterval(() => {
      const result = this.validateConfiguration();
      if (!result.isValid) {
        console.warn(`⚠️ [RUNTIME MONITOR] Configuration issue detected:`, result);
      }
    }, 30000);
  }

  /**
   * Save analysis report for debugging
   */
  private saveAnalysisReport(analysis: any): void {
    try {
      const reportsDir = path.join(process.cwd(), 'logs', 'extreme-debugging');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportPath = path.join(reportsDir, `analysis-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
      console.log(`📝 [EXTREME MONITOR] Analysis report saved: ${reportPath}`);
    } catch (error) {
      console.error('🚨 [EXTREME MONITOR] Failed to save analysis report:', error);
    }
  }

  /**
   * Get monitoring history for debugging
   */
  getMonitoringHistory(): ConfigValidationResult[] {
    return this.validationHistory;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🔍 [EXTREME MONITOR] Monitoring stopped');
    }
  }
}

// Auto-start monitoring if in server environment
if (typeof window === 'undefined') {
  const monitor = ExtremeConfigMonitor.getInstance();
  monitor.startExtremeMonitoring();
}
