
/**
 * 🚀 STARTUP PHASE TRACKER
 * Tracks every phase of application startup with 1-second granularity
 */

interface StartupPhase {
  phase: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  details?: any;
}

export class StartupTracker {
  private static instance: StartupTracker;
  private phases: StartupPhase[] = [];
  private startupStartTime: number;

  static getInstance(): StartupTracker {
    if (!StartupTracker.instance) {
      StartupTracker.instance = new StartupTracker();
    }
    return StartupTracker.instance;
  }

  constructor() {
    this.startupStartTime = Date.now();
    console.log('🚀 [STARTUP TRACKER] Application startup tracking initiated');
  }

  /**
   * Mark the start of a startup phase
   */
  startPhase(phase: string, details?: any): void {
    const phaseData: StartupPhase = {
      phase,
      startTime: Date.now(),
      status: 'STARTED',
      details
    };

    this.phases.push(phaseData);
    
    const elapsedSinceStart = Date.now() - this.startupStartTime;
    console.log(`🚀 [STARTUP TRACKER] [${elapsedSinceStart}ms] Phase started: ${phase}`);
  }

  /**
   * Mark the completion of a startup phase
   */
  completePhase(phase: string, details?: any): void {
    const phaseIndex = this.phases.findIndex(p => p.phase === phase && p.status === 'STARTED');
    
    if (phaseIndex !== -1) {
      const phaseData = this.phases[phaseIndex];
      phaseData.endTime = Date.now();
      phaseData.duration = phaseData.endTime - phaseData.startTime;
      phaseData.status = 'COMPLETED';
      phaseData.details = { ...phaseData.details, ...details };

      const elapsedSinceStart = Date.now() - this.startupStartTime;
      console.log(`🚀 [STARTUP TRACKER] [${elapsedSinceStart}ms] Phase completed: ${phase} (took ${phaseData.duration}ms)`);
    }
  }

  /**
   * Mark a startup phase as failed
   */
  failPhase(phase: string, error: any): void {
    const phaseIndex = this.phases.findIndex(p => p.phase === phase && p.status === 'STARTED');
    
    if (phaseIndex !== -1) {
      const phaseData = this.phases[phaseIndex];
      phaseData.endTime = Date.now();
      phaseData.duration = phaseData.endTime - phaseData.startTime;
      phaseData.status = 'FAILED';
      phaseData.details = { ...phaseData.details, error: error.toString() };

      const elapsedSinceStart = Date.now() - this.startupStartTime;
      console.error(`🚨 [STARTUP TRACKER] [${elapsedSinceStart}ms] Phase FAILED: ${phase} (took ${phaseData.duration}ms)`, error);
    }
  }

  /**
   * Get startup summary
   */
  getStartupSummary(): any {
    const totalStartupTime = Date.now() - this.startupStartTime;
    const completedPhases = this.phases.filter(p => p.status === 'COMPLETED');
    const failedPhases = this.phases.filter(p => p.status === 'FAILED');

    return {
      totalStartupTime,
      totalPhases: this.phases.length,
      completedPhases: completedPhases.length,
      failedPhases: failedPhases.length,
      phases: this.phases,
      status: failedPhases.length > 0 ? 'FAILED' : 'SUCCESS'
    };
  }

  /**
   * Log startup summary
   */
  logStartupSummary(): void {
    const summary = this.getStartupSummary();
    console.log('🚀 [STARTUP TRACKER] STARTUP SUMMARY:', summary);
  }
}

// Auto-initialize if in server environment
if (typeof window === 'undefined') {
  const tracker = StartupTracker.getInstance();
  tracker.startPhase('Application Initialization');
}
