/**
 * Deployment Event Tracking System
 * 
 * Comprehensive deployment event tracking for Choreo deployments
 * Captures build stages, container lifecycle, health checks, and deployment phases
 * Provides real-time deployment monitoring with correlation tracking
 */

import { CorrelationManager } from './correlation';
import { Logger } from './logger';
import { StreamingTransport } from './streaming-transport';
import { PerformanceMetricsCollector } from './performance-metrics';
import { AutomatedErrorDetectionEngine } from './automated-error-detection';

export enum DeploymentStage {
  INIT = 'INIT',
  DEPENDENCY_INSTALL = 'DEPENDENCY_INSTALL',
  BUILD = 'BUILD',
  TEST = 'TEST',
  DOCKER_BUILD = 'DOCKER_BUILD',
  REGISTRY_PUSH = 'REGISTRY_PUSH',
  CHOREO_DEPLOY = 'CHOREO_DEPLOY',
  HEALTH_CHECK = 'HEALTH_CHECK',
  TRAFFIC_ROUTING = 'TRAFFIC_ROUTING',
  COMPLETION = 'COMPLETION',
  ROLLBACK = 'ROLLBACK',
  FAILURE = 'FAILURE'
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED'
}

export enum DeploymentEnvironment {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  PREVIEW = 'PREVIEW'
}

export interface DeploymentContext {
  deploymentId: string;
  correlationId: string;
  environment: DeploymentEnvironment;
  version: string;
  commitHash: string;
  branch: string;
  triggeredBy: string;
  triggeredAt: Date;
  choreoProjectId?: string;
  choreoApplicationId?: string;
}

export interface DeploymentStageEvent {
  stageId: string;
  stage: DeploymentStage;
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  message?: string;
  details?: Record<string, unknown>;
  error?: Error;
  subStages?: DeploymentStageEvent[];
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkIO?: number;
    buildSize?: number;
    testCoverage?: number;
  };
}

export interface DeploymentEvent {
  eventId: string;
  deploymentId: string;
  correlationId: string;
  timestamp: Date;
  stage: DeploymentStage;
  status: DeploymentStatus;
  message: string;
  details: Record<string, unknown>;
  context: DeploymentContext;
  error?: Error;
  metrics?: Record<string, number>;
}

export interface HealthCheckEvent {
  checkId: string;
  deploymentId: string;
  timestamp: Date;
  endpoint: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  responseTime: number;
  statusCode?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DeploymentPipeline {
  pipelineId: string;
  deploymentId: string;
  stages: DeploymentStageEvent[];
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  successfulStages: number;
  failedStages: number;
  warnings: number;
}

export class DeploymentEventTracker {
  private logger: Logger;
  private correlationManager: CorrelationManager;
  private streamingTransport: StreamingTransport;
  private performanceCollector: PerformanceMetricsCollector;
  private errorDetection: AutomatedErrorDetectionEngine;
  private deployments: Map<string, DeploymentPipeline> = new Map();
  private healthChecks: Map<string, HealthCheckEvent[]> = new Map();
  private eventSubscribers: Set<(event: DeploymentEvent) => void> = new Set();

  constructor() {
    this.logger = Logger.getInstance();
    this.correlationManager = CorrelationManager.getInstance();
    this.streamingTransport = new StreamingTransport();
    this.performanceCollector = PerformanceMetricsCollector.getInstance();
    this.errorDetection = AutomatedErrorDetectionEngine.getInstance();
  }

  /**
   * Start tracking a new deployment
   */
  startDeployment(context: DeploymentContext): DeploymentPipeline {
    const pipeline: DeploymentPipeline = {
      pipelineId: `pipeline_${context.deploymentId}`,
      deploymentId: context.deploymentId,
      stages: [],
      status: DeploymentStatus.PENDING,
      startTime: new Date(),
      successfulStages: 0,
      failedStages: 0,
      warnings: 0
    };

    this.deployments.set(context.deploymentId, pipeline);

    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId: context.deploymentId,
      correlationId: context.correlationId,
      timestamp: new Date(),
      stage: DeploymentStage.INIT,
      status: DeploymentStatus.IN_PROGRESS,
      message: 'Deployment started',
      details: {
        environment: context.environment,
        version: context.version,
        commitHash: context.commitHash,
        branch: context.branch,
        triggeredBy: context.triggeredBy
      },
      context
    };

    this.emitEvent(event);
    return pipeline;
  }

  /**
   * Start a deployment stage
   */
  startStage(
    deploymentId: string,
    stage: DeploymentStage,
    message?: string,
    details?: Record<string, unknown>
  ): string {
    const stageId = this.generateStageId(deploymentId, stage);
    const pipeline = this.deployments.get(deploymentId);

    if (!pipeline) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const stageEvent: DeploymentStageEvent = {
      stageId,
      stage,
      status: DeploymentStatus.IN_PROGRESS,
      startTime: new Date(),
      message,
      details
    };

    pipeline.stages.push(stageEvent);
    pipeline.status = DeploymentStatus.IN_PROGRESS;

    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      timestamp: new Date(),
      stage,
      status: DeploymentStatus.IN_PROGRESS,
      message: message || `Stage ${stage} started`,
      details: details || {},
      context: this.getDeploymentContext(deploymentId)
    };

    this.emitEvent(event);
    this.performanceCollector.startTimer(`deployment_stage_${stage.toLowerCase()}`);

    return stageId;
  }

  /**
   * Complete a deployment stage
   */
  completeStage(
    deploymentId: string,
    stageId: string,
    status: DeploymentStatus,
    message?: string,
    error?: Error,
    metrics?: Record<string, number>
  ): void {
    const pipeline = this.deployments.get(deploymentId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.stageId === stageId);
    if (!stage) return;

    stage.status = status;
    stage.endTime = new Date();
    stage.duration = stage.endTime.getTime() - stage.startTime.getTime();
    stage.error = error;

    // Update pipeline statistics
    if (status === DeploymentStatus.SUCCESS) {
      pipeline.successfulStages++;
    } else if (status === DeploymentStatus.ERROR) {
      pipeline.failedStages++;
    } else if (status === DeploymentStatus.WARNING) {
      pipeline.warnings++;
    }

    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      timestamp: new Date(),
      stage: stage.stage,
      status,
      message: message || `Stage ${stage.stage} ${status.toLowerCase()}`,
      details: {
        duration: stage.duration,
        ...stage.details
      },
      context: this.getDeploymentContext(deploymentId),
      error,
      metrics
    };

    this.emitEvent(event);
    this.performanceCollector.endTimer(`deployment_stage_${stage.stage.toLowerCase()}`);

    // Trigger error detection if stage failed
    if (status === DeploymentStatus.ERROR && error) {
      this.errorDetection.detectError(error, {
        deploymentId,
        stage: stage.stage,
        correlationId: event.correlationId
      });
    }
  }

  /**
   * Complete entire deployment
   */
  completeDeployment(
    deploymentId: string,
    status: DeploymentStatus,
    message?: string
  ): void {
    const pipeline = this.deployments.get(deploymentId);
    if (!pipeline) return;

    pipeline.status = status;
    pipeline.endTime = new Date();
    pipeline.totalDuration = pipeline.endTime.getTime() - pipeline.startTime.getTime();

    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      timestamp: new Date(),
      stage: status === DeploymentStatus.SUCCESS ? DeploymentStage.COMPLETION : DeploymentStage.FAILURE,
      status,
      message: message || `Deployment ${status.toLowerCase()}`,
      details: {
        totalDuration: pipeline.totalDuration,
        successfulStages: pipeline.successfulStages,
        failedStages: pipeline.failedStages,
        warnings: pipeline.warnings,
        stageCount: pipeline.stages.length
      },
      context: this.getDeploymentContext(deploymentId)
    };

    this.emitEvent(event);

    // Generate deployment summary
    this.generateDeploymentSummary(deploymentId);
  }

  /**
   * Record health check event
   */
  recordHealthCheck(
    deploymentId: string,
    endpoint: string,
    status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED',
    responseTime: number,
    statusCode?: number,
    error?: string,
    details?: Record<string, unknown>
  ): void {
    const healthCheck: HealthCheckEvent = {
      checkId: this.generateEventId(),
      deploymentId,
      timestamp: new Date(),
      endpoint,
      status,
      responseTime,
      statusCode,
      error,
      details
    };

    if (!this.healthChecks.has(deploymentId)) {
      this.healthChecks.set(deploymentId, []);
    }
    this.healthChecks.get(deploymentId)!.push(healthCheck);

    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      timestamp: new Date(),
      stage: DeploymentStage.HEALTH_CHECK,
      status: status === 'HEALTHY' ? DeploymentStatus.SUCCESS : 
              status === 'DEGRADED' ? DeploymentStatus.WARNING : DeploymentStatus.ERROR,
      message: `Health check ${status.toLowerCase()}: ${endpoint}`,
      details: {
        endpoint,
        responseTime,
        statusCode,
        error,
        ...details
      },
      context: this.getDeploymentContext(deploymentId),
      metrics: { responseTime }
    };

    this.emitEvent(event);
  }

  /**
   * Track Choreo-specific deployment events
   */
  trackChoreoEvent(
    deploymentId: string,
    eventType: 'BUILD_STARTED' | 'BUILD_COMPLETED' | 'DEPLOYMENT_TRIGGERED' | 
              'CONTAINER_STARTING' | 'CONTAINER_READY' | 'TRAFFIC_ROUTED',
    message: string,
    details?: Record<string, unknown>
  ): void {
    const stage = this.mapChoreoEventToStage(eventType);
    
    const event: DeploymentEvent = {
      eventId: this.generateEventId(),
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      timestamp: new Date(),
      stage,
      status: DeploymentStatus.IN_PROGRESS,
      message: `Choreo: ${message}`,
      details: {
        choreoEvent: eventType,
        ...details
      },
      context: this.getDeploymentContext(deploymentId)
    };

    this.emitEvent(event);
  }

  /**
   * Subscribe to deployment events
   */
  subscribe(callback: (event: DeploymentEvent) => void): () => void {
    this.eventSubscribers.add(callback);
    return () => this.eventSubscribers.delete(callback);
  }

  /**
   * Get deployment pipeline status
   */
  getDeploymentPipeline(deploymentId: string): DeploymentPipeline | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get health check history for deployment
   */
  getHealthChecks(deploymentId: string): HealthCheckEvent[] {
    return this.healthChecks.get(deploymentId) || [];
  }

  /**
   * Get all active deployments
   */
  getActiveDeployments(): DeploymentPipeline[] {
    return Array.from(this.deployments.values()).filter(
      d => d.status === DeploymentStatus.IN_PROGRESS || d.status === DeploymentStatus.PENDING
    );
  }

  /**
   * Generate deployment summary report
   */
  generateDeploymentSummary(deploymentId: string): Record<string, unknown> {
    const pipeline = this.deployments.get(deploymentId);
    const healthChecks = this.healthChecks.get(deploymentId) || [];

    if (!pipeline) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const summary = {
      deploymentId,
      status: pipeline.status,
      duration: pipeline.totalDuration,
      stages: {
        total: pipeline.stages.length,
        successful: pipeline.successfulStages,
        failed: pipeline.failedStages,
        warnings: pipeline.warnings
      },
      healthChecks: {
        total: healthChecks.length,
        healthy: healthChecks.filter(h => h.status === 'HEALTHY').length,
        unhealthy: healthChecks.filter(h => h.status === 'UNHEALTHY').length,
        degraded: healthChecks.filter(h => h.status === 'DEGRADED').length
      },
      performance: {
        averageStageTime: pipeline.stages.reduce((sum, stage) => 
          sum + (stage.duration || 0), 0) / pipeline.stages.length,
        slowestStage: pipeline.stages.reduce((slowest, stage) => 
          (stage.duration || 0) > (slowest?.duration || 0) ? stage : slowest, pipeline.stages[0]),
        fastestStage: pipeline.stages.reduce((fastest, stage) => 
          (stage.duration || 0) < (fastest?.duration || 0) ? stage : fastest, pipeline.stages[0])
      }
    };

    this.logger.info('Deployment summary generated', {
      deploymentId,
      summary,
      correlationId: this.correlationManager.getCurrentCorrelationId()
    });

    return summary;
  }

  private emitEvent(event: DeploymentEvent): void {
    // Log the event
    this.logger.info('Deployment event', {
      event,
      correlationId: event.correlationId
    });

    // Stream to real-time subscribers
    this.streamingTransport.stream(event);

    // Notify event subscribers
    this.eventSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        this.logger.error('Error in deployment event subscriber', { error });
      }
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStageId(deploymentId: string, stage: DeploymentStage): string {
    return `${deploymentId}_${stage}_${Date.now()}`;
  }

  private mapChoreoEventToStage(eventType: string): DeploymentStage {
    const mapping: Record<string, DeploymentStage> = {
      'BUILD_STARTED': DeploymentStage.BUILD,
      'BUILD_COMPLETED': DeploymentStage.BUILD,
      'DEPLOYMENT_TRIGGERED': DeploymentStage.CHOREO_DEPLOY,
      'CONTAINER_STARTING': DeploymentStage.CHOREO_DEPLOY,
      'CONTAINER_READY': DeploymentStage.CHOREO_DEPLOY,
      'TRAFFIC_ROUTED': DeploymentStage.TRAFFIC_ROUTING
    };
    return mapping[eventType] || DeploymentStage.CHOREO_DEPLOY;
  }

  private getDeploymentContext(deploymentId: string): DeploymentContext {
    const pipeline = this.deployments.get(deploymentId);
    if (!pipeline) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    // This would typically be stored during deployment start
    // For now, return a minimal context
    return {
      deploymentId,
      correlationId: this.correlationManager.getCurrentCorrelationId(),
      environment: DeploymentEnvironment.DEVELOPMENT,
      version: '1.0.0',
      commitHash: 'unknown',
      branch: 'main',
      triggeredBy: 'system',
      triggeredAt: pipeline.startTime
    };
  }
}

// Singleton instance
let deploymentTrackerInstance: DeploymentEventTracker | null = null;

export const getDeploymentTracker = (): DeploymentEventTracker => {
  if (!deploymentTrackerInstance) {
    deploymentTrackerInstance = new DeploymentEventTracker();
  }
  return deploymentTrackerInstance;
};

// Helper functions for common deployment tracking scenarios
export const trackDeploymentStage = async <T>(
  deploymentId: string,
  stage: DeploymentStage,
  operation: () => Promise<T>,
  message?: string
): Promise<T> => {
  const tracker = getDeploymentTracker();
  const stageId = tracker.startStage(deploymentId, stage, message);

  try {
    const result = await operation();
    tracker.completeStage(deploymentId, stageId, DeploymentStatus.SUCCESS);
    return result;
  } catch (error) {
    tracker.completeStage(
      deploymentId,
      stageId,
      DeploymentStatus.ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

export const trackHealthCheck = async (
  deploymentId: string,
  endpoint: string,
  checkFunction: () => Promise<{ status: number; responseTime: number; data?: unknown }>
): Promise<void> => {
  const tracker = getDeploymentTracker();
  const startTime = Date.now();

  try {
    const result = await checkFunction();
    const responseTime = Date.now() - startTime;
    
    const status = result.status >= 200 && result.status < 300 ? 'HEALTHY' :
                   result.status >= 300 && result.status < 400 ? 'DEGRADED' : 'UNHEALTHY';

    tracker.recordHealthCheck(
      deploymentId,
      endpoint,
      status,
      responseTime,
      result.status,
      undefined,
      { data: result.data }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    tracker.recordHealthCheck(
      deploymentId,
      endpoint,
      'UNHEALTHY',
      responseTime,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
};