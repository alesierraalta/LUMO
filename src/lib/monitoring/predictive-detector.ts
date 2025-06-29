
/**
 * 🔮 PREDICTIVE FAILURE DETECTION
 * Analyzes patterns to predict configuration and deployment failures
 */

interface FailurePattern {
  pattern: string;
  indicators: string[];
  probability: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export class PredictiveFailureDetector {
  private static instance: PredictiveFailureDetector;
  private knownPatterns: FailurePattern[] = [];

  static getInstance(): PredictiveFailureDetector {
    if (!PredictiveFailureDetector.instance) {
      PredictiveFailureDetector.instance = new PredictiveFailureDetector();
    }
    return PredictiveFailureDetector.instance;
  }

  constructor() {
    this.initializeKnownPatterns();
  }

  /**
   * Initialize known failure patterns from historical data
   */
  private initializeKnownPatterns(): void {
    this.knownPatterns = [
      {
        pattern: 'Missing Supabase Configuration',
        indicators: [
          'hasMissingConfig: true',
          'Missing environment variables',
          'Fallback client warnings',
          'NEXT_PUBLIC_SUPABASE_URL undefined'
        ],
        probability: 0.95,
        severity: 'CRITICAL',
        recommendations: [
          'Configure Supabase environment variables in Choreo console',
          'Verify environment variable names match expected format',
          'Check Choreo deployment environment configuration'
        ]
      },
      {
        pattern: 'BUILD_ID Generation Failure',
        indicators: [
          'BUILD_ID: false',
          'Missing .next/BUILD_ID file',
          'Build process incomplete',
          'Development mode in production'
        ],
        probability: 0.85,
        severity: 'HIGH',
        recommendations: [
          'Verify build process completes successfully',
          'Check Dockerfile build stage',
          'Ensure .next directory is properly copied to runtime container'
        ]
      },
      {
        pattern: 'Startup Performance Degradation',
        indicators: [
          'Startup time > 2 seconds',
          'Configuration validation failures',
          'Multiple fallback client initializations',
          'Environment detection issues'
        ],
        probability: 0.75,
        severity: 'MEDIUM',
        recommendations: [
          'Optimize configuration validation',
          'Implement configuration caching',
          'Reduce startup dependencies'
        ]
      }
    ];

    console.log(`🔮 [PREDICTIVE DETECTOR] Initialized with ${this.knownPatterns.length} known failure patterns`);
  }

  /**
   * Analyze current state for potential failures
   */
  analyzeForPotentialFailures(currentState: any): FailurePattern[] {
    const detectedPatterns: FailurePattern[] = [];

    for (const pattern of this.knownPatterns) {
      const matchingIndicators = pattern.indicators.filter(indicator => 
        this.checkIndicator(indicator, currentState)
      );

      if (matchingIndicators.length > 0) {
        const adjustedProbability = (matchingIndicators.length / pattern.indicators.length) * pattern.probability;
        
        if (adjustedProbability > 0.5) {
          detectedPatterns.push({
            ...pattern,
            probability: adjustedProbability
          });

          console.log(`🔮 [PREDICTIVE DETECTOR] Pattern detected: ${pattern.pattern} (probability: ${adjustedProbability.toFixed(2)})`);
        }
      }
    }

    return detectedPatterns;
  }

  /**
   * Check if an indicator matches current state
   */
  private checkIndicator(indicator: string, currentState: any): boolean {
    const stateString = JSON.stringify(currentState).toLowerCase();
    return stateString.includes(indicator.toLowerCase());
  }

  /**
   * Generate predictive alerts
   */
  generatePredictiveAlerts(detectedPatterns: FailurePattern[]): void {
    for (const pattern of detectedPatterns) {
      console.log(`🚨 [PREDICTIVE ALERT] ${pattern.severity}: ${pattern.pattern}`);
      console.log(`   Probability: ${(pattern.probability * 100).toFixed(1)}%`);
      console.log(`   Recommendations:`);
      pattern.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }
}
