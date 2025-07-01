'use client';

/**
 * Live Deployment Status Tracker
 * 
 * Real-time deployment status tracking component
 * Provides detailed timeline visualization, stage progress, and failure analysis
 * Integrates with deployment event tracker for live updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  AlertTriangle,
  Zap,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ExternalLink,
  Timer,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import {
  DeploymentEvent,
  DeploymentStage,
  DeploymentStatus,
  DeploymentPipeline,
  DeploymentStageEvent,
  DeploymentEnvironment,
  getDeploymentTracker
} from '@/lib/logger/deployment-event-tracker';
import { useCorrelation } from '@/lib/logger/correlation';

interface DeploymentStatusTrackerProps {
  deploymentId?: string;
  environment?: DeploymentEnvironment;
  autoRefresh?: boolean;
  showTimeline?: boolean;
  showMetrics?: boolean;
}

interface StageProgress {
  stage: DeploymentStage;
  status: DeploymentStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  error?: string;
  metrics?: Record<string, number>;
}

interface DeploymentSummary {
  deploymentId: string;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  currentStage?: DeploymentStage;
  progress: number;
  stages: StageProgress[];
  successRate: number;
  averageStageTime: number;
  criticalErrors: number;
  warnings: number;
}

const STAGE_DISPLAY_NAMES: Record<DeploymentStage, string> = {
  [DeploymentStage.INIT]: 'Initialization',
  [DeploymentStage.DEPENDENCY_INSTALL]: 'Dependencies',
  [DeploymentStage.BUILD]: 'Build',
  [DeploymentStage.TEST]: 'Testing',
  [DeploymentStage.DOCKER_BUILD]: 'Docker Build',
  [DeploymentStage.REGISTRY_PUSH]: 'Registry Push',
  [DeploymentStage.CHOREO_DEPLOY]: 'Choreo Deploy',
  [DeploymentStage.HEALTH_CHECK]: 'Health Check',
  [DeploymentStage.TRAFFIC_ROUTING]: 'Traffic Routing',
  [DeploymentStage.COMPLETION]: 'Completion',
  [DeploymentStage.ROLLBACK]: 'Rollback',
  [DeploymentStage.FAILURE]: 'Failure'
};

const STAGE_DESCRIPTIONS: Record<DeploymentStage, string> = {
  [DeploymentStage.INIT]: 'Setting up deployment environment',
  [DeploymentStage.DEPENDENCY_INSTALL]: 'Installing project dependencies',
  [DeploymentStage.BUILD]: 'Compiling and building application',
  [DeploymentStage.TEST]: 'Running automated tests',
  [DeploymentStage.DOCKER_BUILD]: 'Building Docker container image',
  [DeploymentStage.REGISTRY_PUSH]: 'Pushing image to container registry',
  [DeploymentStage.CHOREO_DEPLOY]: 'Deploying to Choreo platform',
  [DeploymentStage.HEALTH_CHECK]: 'Verifying application health',
  [DeploymentStage.TRAFFIC_ROUTING]: 'Routing traffic to new deployment',
  [DeploymentStage.COMPLETION]: 'Deployment completed successfully',
  [DeploymentStage.ROLLBACK]: 'Rolling back to previous version',
  [DeploymentStage.FAILURE]: 'Deployment failed'
};

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  [DeploymentStatus.PENDING]: 'bg-gray-200 text-gray-700',
  [DeploymentStatus.IN_PROGRESS]: 'bg-blue-200 text-blue-700',
  [DeploymentStatus.SUCCESS]: 'bg-green-200 text-green-700',
  [DeploymentStatus.WARNING]: 'bg-yellow-200 text-yellow-700',
  [DeploymentStatus.ERROR]: 'bg-red-200 text-red-700',
  [DeploymentStatus.TIMEOUT]: 'bg-orange-200 text-orange-700',
  [DeploymentStatus.CANCELLED]: 'bg-gray-300 text-gray-600'
};

const STATUS_ICONS: Record<DeploymentStatus, React.ReactNode> = {
  [DeploymentStatus.PENDING]: <Clock className="h-4 w-4" />,
  [DeploymentStatus.IN_PROGRESS]: <Activity className="h-4 w-4 animate-spin" />,
  [DeploymentStatus.SUCCESS]: <CheckCircle className="h-4 w-4" />,
  [DeploymentStatus.WARNING]: <AlertTriangle className="h-4 w-4" />,
  [DeploymentStatus.ERROR]: <XCircle className="h-4 w-4" />,
  [DeploymentStatus.TIMEOUT]: <Timer className="h-4 w-4" />,
  [DeploymentStatus.CANCELLED]: <PauseCircle className="h-4 w-4" />
};

export const DeploymentStatusTracker: React.FC<DeploymentStatusTrackerProps> = ({
  deploymentId,
  environment,
  autoRefresh = true,
  showTimeline = true,
  showMetrics = true
}) => {
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(deploymentId || null);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const correlation = useCorrelation();
  const correlationId = correlation.getContext().correlationId;

  // Subscribe to deployment events and update state
  useEffect(() => {
    const deploymentTracker = getDeploymentTracker();

    const unsubscribe = deploymentTracker.subscribe((event: DeploymentEvent) => {
      if (isLive) {
        updateDeploymentFromEvent(event);
        setLastUpdate(new Date());
      }
    });

    // Initial load of active deployments
    const activeDeployments = deploymentTracker.getActiveDeployments();
    setDeployments(activeDeployments.map(convertPipelineToSummary));

    // Auto-refresh interval
    const refreshInterval = autoRefresh ? setInterval(() => {
      if (isLive) {
        const currentDeployments = deploymentTracker.getActiveDeployments();
        setDeployments(currentDeployments.map(convertPipelineToSummary));
        setLastUpdate(new Date());
      }
    }, 2000) : null;

    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isLive, autoRefresh]);

  const updateDeploymentFromEvent = useCallback((event: DeploymentEvent) => {
    setDeployments(prev => {
      const existingIndex = prev.findIndex(d => d.deploymentId === event.deploymentId);
      
      if (existingIndex >= 0) {
        // Update existing deployment
        const updated = [...prev];
        updated[existingIndex] = updateDeploymentSummary(updated[existingIndex], event);
        return updated;
      } else {
        // Add new deployment
        const newDeployment = createDeploymentSummaryFromEvent(event);
        return [newDeployment, ...prev];
      }
    });
  }, []);

  const convertPipelineToSummary = (pipeline: DeploymentPipeline): DeploymentSummary => {
    const stages: StageProgress[] = pipeline.stages.map(stage => ({
      stage: stage.stage,
      status: stage.status,
      startTime: stage.startTime,
      endTime: stage.endTime,
      duration: stage.duration,
      progress: stage.status === DeploymentStatus.SUCCESS ? 100 :
                stage.status === DeploymentStatus.ERROR ? 0 :
                stage.status === DeploymentStatus.IN_PROGRESS ? 50 : 0,
      error: stage.error?.message,
      metrics: stage.metrics
    }));

    const completedStages = stages.filter(s => 
      s.status === DeploymentStatus.SUCCESS || s.status === DeploymentStatus.ERROR
    ).length;

    const successfulStages = stages.filter(s => s.status === DeploymentStatus.SUCCESS).length;
    const totalProgress = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;
    const successRate = stages.length > 0 ? (successfulStages / stages.length) * 100 : 0;

    const averageStageTime = stages.length > 0 ? 
      stages.reduce((sum, stage) => sum + (stage.duration || 0), 0) / stages.length : 0;

    const criticalErrors = stages.filter(s => s.status === DeploymentStatus.ERROR).length;
    const warnings = stages.filter(s => s.status === DeploymentStatus.WARNING).length;

    const currentStage = stages.find(s => s.status === DeploymentStatus.IN_PROGRESS)?.stage;

    return {
      deploymentId: pipeline.deploymentId,
      status: pipeline.status,
      environment: DeploymentEnvironment.DEVELOPMENT, // Default, should be from context
      startTime: pipeline.startTime,
      endTime: pipeline.endTime,
      totalDuration: pipeline.totalDuration,
      currentStage,
      progress: totalProgress,
      stages,
      successRate,
      averageStageTime,
      criticalErrors,
      warnings
    };
  };

  const createDeploymentSummaryFromEvent = (event: DeploymentEvent): DeploymentSummary => {
    return {
      deploymentId: event.deploymentId,
      status: event.status,
      environment: event.context.environment,
      startTime: event.timestamp,
      currentStage: event.stage,
      progress: 0,
      stages: [{
        stage: event.stage,
        status: event.status,
        startTime: event.timestamp,
        progress: event.status === DeploymentStatus.IN_PROGRESS ? 50 : 0
      }],
      successRate: 0,
      averageStageTime: 0,
      criticalErrors: 0,
      warnings: 0
    };
  };

  const updateDeploymentSummary = (summary: DeploymentSummary, event: DeploymentEvent): DeploymentSummary => {
    const updatedStages = [...summary.stages];
    const stageIndex = updatedStages.findIndex(s => s.stage === event.stage);

    if (stageIndex >= 0) {
      // Update existing stage
      updatedStages[stageIndex] = {
        ...updatedStages[stageIndex],
        status: event.status,
        endTime: event.timestamp,
        duration: event.timestamp.getTime() - updatedStages[stageIndex].startTime!.getTime(),
        progress: event.status === DeploymentStatus.SUCCESS ? 100 :
                  event.status === DeploymentStatus.ERROR ? 0 :
                  event.status === DeploymentStatus.IN_PROGRESS ? 50 : 0,
        error: event.error?.message,
        metrics: event.metrics
      };
    } else {
      // Add new stage
      updatedStages.push({
        stage: event.stage,
        status: event.status,
        startTime: event.timestamp,
        progress: event.status === DeploymentStatus.IN_PROGRESS ? 50 : 0,
        error: event.error?.message,
        metrics: event.metrics
      });
    }

    // Recalculate summary metrics
    const completedStages = updatedStages.filter(s => 
      s.status === DeploymentStatus.SUCCESS || s.status === DeploymentStatus.ERROR
    ).length;
    const successfulStages = updatedStages.filter(s => s.status === DeploymentStatus.SUCCESS).length;
    const totalProgress = updatedStages.length > 0 ? (completedStages / updatedStages.length) * 100 : 0;
    const successRate = updatedStages.length > 0 ? (successfulStages / updatedStages.length) * 100 : 0;
    const criticalErrors = updatedStages.filter(s => s.status === DeploymentStatus.ERROR).length;
    const warnings = updatedStages.filter(s => s.status === DeploymentStatus.WARNING).length;

    return {
      ...summary,
      status: event.status,
      endTime: event.stage === DeploymentStage.COMPLETION || event.stage === DeploymentStage.FAILURE ? 
               event.timestamp : summary.endTime,
      totalDuration: (event.timestamp.getTime() - summary.startTime.getTime()),
      currentStage: event.status === DeploymentStatus.IN_PROGRESS ? event.stage : summary.currentStage,
      progress: totalProgress,
      stages: updatedStages,
      successRate,
      criticalErrors,
      warnings
    };
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
  };

  const getStatusTrend = (deployment: DeploymentSummary): 'up' | 'down' | 'stable' => {
    const recentStages = deployment.stages.slice(-3);
    const errorCount = recentStages.filter(s => s.status === DeploymentStatus.ERROR).length;
    const successCount = recentStages.filter(s => s.status === DeploymentStatus.SUCCESS).length;
    
    if (errorCount > successCount) return 'down';
    if (successCount > errorCount) return 'up';
    return 'stable';
  };

  const selectedDeploymentData = deployments.find(d => d.deploymentId === selectedDeployment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Live Deployment Status</h2>
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? "LIVE" : "PAUSED"}
          </Badge>
          {correlationId && (
            <Badge variant="outline">
              Tracking: {correlationId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="flex items-center space-x-1"
          >
            {isLive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            <span>{isLive ? 'Pause' : 'Resume'}</span>
          </Button>
          
          <span className="text-sm text-gray-500">
            Last update: {formatTimestamp(lastUpdate)}
          </span>
        </div>
      </div>

      {/* Deployment List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Active Deployments</span>
                <Badge>{deployments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {deployments.map(deployment => (
                  <div
                    key={deployment.deploymentId}
                    className={`mb-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDeployment === deployment.deploymentId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDeployment(deployment.deploymentId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {deployment.deploymentId.slice(0, 12)}...
                      </span>
                      <div className="flex items-center space-x-1">
                        {STATUS_ICONS[deployment.status]}
                        {getStatusTrend(deployment) === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {getStatusTrend(deployment) === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                    </div>
                    
                    <Progress value={deployment.progress} className="mb-2 h-2" />
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{deployment.environment}</span>
                      <span>{Math.round(deployment.progress)}%</span>
                    </div>
                    
                    {deployment.currentStage && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {STAGE_DISPLAY_NAMES[deployment.currentStage]}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {deployments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No active deployments
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedDeploymentData ? (
            <div className="space-y-4">
              {/* Deployment Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{selectedDeploymentData.deploymentId}</span>
                      <Badge className={STATUS_COLORS[selectedDeploymentData.status]}>
                        {selectedDeploymentData.status}
                      </Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View in Choreo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="text-xl font-bold">{Math.round(selectedDeploymentData.progress)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="text-xl font-bold">
                        {selectedDeploymentData.totalDuration ? 
                          formatDuration(selectedDeploymentData.totalDuration) : 
                          formatDuration(Date.now() - selectedDeploymentData.startTime.getTime())
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="text-xl font-bold text-green-600">{Math.round(selectedDeploymentData.successRate)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Errors</div>
                      <div className="text-xl font-bold text-red-600">{selectedDeploymentData.criticalErrors}</div>
                    </div>
                  </div>

                  <Progress value={selectedDeploymentData.progress} className="h-3" />
                </CardContent>
              </Card>

              {/* Stage Timeline */}
              {showTimeline && (
                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDeploymentData.stages.map((stage, index) => (
                        <div key={`${stage.stage}-${index}`} className="flex items-start space-x-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${STATUS_COLORS[stage.status]}`}>
                              {STATUS_ICONS[stage.status]}
                            </div>
                            {index < selectedDeploymentData.stages.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{STAGE_DISPLAY_NAMES[stage.stage]}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {stage.startTime && (
                                  <span>{formatTimestamp(stage.startTime)}</span>
                                )}
                                {stage.duration && (
                                  <Badge variant="outline">
                                    {formatDuration(stage.duration)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {STAGE_DESCRIPTIONS[stage.stage]}
                            </p>
                            
                            {stage.progress > 0 && (
                              <Progress value={stage.progress} className="h-2 mb-2" />
                            )}
                            
                            {stage.error && (
                              <Alert className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  {stage.error}
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {showMetrics && stage.metrics && Object.keys(stage.metrics).length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {Object.entries(stage.metrics).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="font-medium ml-1">{value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a deployment to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentStatusTracker;