'use client';

/**
 * Real-time Monitoring Dashboard
 * 
 * Comprehensive dashboard for monitoring Choreo deployments in real-time
 * Displays live logs, deployment progress, performance metrics, and alerts
 * Provides extreme debugging visibility into every aspect of the system
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  Zap,
  Filter,
  Search,
  Pause,
  Play,
  Download,
  RefreshCw
} from 'lucide-react';

import { 
  DeploymentEvent, 
  DeploymentStage, 
  DeploymentStatus,
  DeploymentPipeline,
  HealthCheckEvent,
  getDeploymentTracker 
} from '@/lib/logger/deployment-event-tracker';
import { StreamingTransport } from '@/lib/logger/streaming-transport';
import { PerformanceMetricsCollector, PerformanceMetric } from '@/lib/logger/performance-metrics';
import { AutomatedErrorDetectionEngine, Alert } from '@/lib/logger/automated-error-detection';
import { useCorrelation } from '@/lib/logger/correlation';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  correlationId?: string;
  source: string;
  data?: Record<string, unknown>;
}

interface DashboardFilters {
  correlationId?: string;
  logLevel?: string;
  deploymentId?: string;
  timeRange?: string;
  source?: string;
  stage?: DeploymentStage;
}

interface DashboardState {
  logs: LogEntry[];
  deploymentEvents: DeploymentEvent[];
  activeDeployments: DeploymentPipeline[];
  performanceMetrics: PerformanceMetric[];
  alerts: Alert[];
  healthChecks: HealthCheckEvent[];
  isStreaming: boolean;
  filters: DashboardFilters;
}

const STAGE_COLORS: Record<DeploymentStage, string> = {
  [DeploymentStage.INIT]: 'bg-blue-500',
  [DeploymentStage.DEPENDENCY_INSTALL]: 'bg-purple-500',
  [DeploymentStage.BUILD]: 'bg-orange-500',
  [DeploymentStage.TEST]: 'bg-green-500',
  [DeploymentStage.DOCKER_BUILD]: 'bg-indigo-500',
  [DeploymentStage.REGISTRY_PUSH]: 'bg-pink-500',
  [DeploymentStage.CHOREO_DEPLOY]: 'bg-yellow-500',
  [DeploymentStage.HEALTH_CHECK]: 'bg-teal-500',
  [DeploymentStage.TRAFFIC_ROUTING]: 'bg-cyan-500',
  [DeploymentStage.COMPLETION]: 'bg-green-600',
  [DeploymentStage.ROLLBACK]: 'bg-red-500',
  [DeploymentStage.FAILURE]: 'bg-red-600'
};

const STATUS_ICONS: Record<DeploymentStatus, React.ReactNode> = {
  [DeploymentStatus.PENDING]: <Clock className="h-4 w-4 text-gray-500" />,
  [DeploymentStatus.IN_PROGRESS]: <Activity className="h-4 w-4 text-blue-500 animate-spin" />,
  [DeploymentStatus.SUCCESS]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [DeploymentStatus.WARNING]: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  [DeploymentStatus.ERROR]: <XCircle className="h-4 w-4 text-red-500" />,
  [DeploymentStatus.TIMEOUT]: <Clock className="h-4 w-4 text-red-400" />,
  [DeploymentStatus.CANCELLED]: <XCircle className="h-4 w-4 text-gray-500" />
};

export const RealTimeMonitoringDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    logs: [],
    deploymentEvents: [],
    activeDeployments: [],
    performanceMetrics: [],
    alerts: [],
    healthChecks: [],
    isStreaming: true,
    filters: {}
  });

  const { correlationId } = useCorrelation();
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Initialize streaming and data sources
  useEffect(() => {
    const deploymentTracker = getDeploymentTracker();
    const streamingTransport = new StreamingTransport();
    const performanceCollector = PerformanceMetricsCollector.getInstance();
    const errorDetection = AutomatedErrorDetectionEngine.getInstance();

    // Subscribe to deployment events
    const unsubscribeDeployment = deploymentTracker.subscribe((event: DeploymentEvent) => {
      if (state.isStreaming) {
        setState(prev => ({
          ...prev,
          deploymentEvents: [event, ...prev.deploymentEvents].slice(0, 1000) // Keep last 1000 events
        }));
      }
    });

    // Subscribe to streaming logs
    const unsubscribeStreaming = streamingTransport.subscribe((data: unknown) => {
      if (state.isStreaming && isLogEntry(data)) {
        setState(prev => ({
          ...prev,
          logs: [data, ...prev.logs].slice(0, 1000) // Keep last 1000 logs
        }));
      }
    });

    // Subscribe to alerts
    const unsubscribeAlerts = errorDetection.subscribeToAlerts((alert: Alert) => {
      setState(prev => ({
        ...prev,
        alerts: [alert, ...prev.alerts].slice(0, 100) // Keep last 100 alerts
      }));
    });

    // Periodic data refresh
    const refreshInterval = setInterval(() => {
      // Get active deployments
      const activeDeployments = deploymentTracker.getActiveDeployments();
      
      // Get recent performance metrics
      const recentMetrics = performanceCollector.getRecentMetrics(300); // Last 5 minutes
      
      setState(prev => ({
        ...prev,
        activeDeployments,
        performanceMetrics: recentMetrics
      }));
    }, 2000);

    return () => {
      unsubscribeDeployment();
      unsubscribeStreaming();
      unsubscribeAlerts();
      clearInterval(refreshInterval);
    };
  }, [state.isStreaming]);

  // Filter logs and events based on current filters
  const filteredLogs = useMemo(() => {
    return state.logs.filter(log => {
      if (state.filters.correlationId && log.correlationId !== state.filters.correlationId) return false;
      if (state.filters.logLevel && log.level !== state.filters.logLevel) return false;
      if (state.filters.source && !log.source.includes(state.filters.source)) return false;
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [state.logs, state.filters, searchTerm]);

  const filteredEvents = useMemo(() => {
    return state.deploymentEvents.filter(event => {
      if (state.filters.deploymentId && event.deploymentId !== state.filters.deploymentId) return false;
      if (state.filters.correlationId && event.correlationId !== state.filters.correlationId) return false;
      if (state.filters.stage && event.stage !== state.filters.stage) return false;
      return true;
    });
  }, [state.deploymentEvents, state.filters]);

  const handleToggleStreaming = useCallback(() => {
    setState(prev => ({ ...prev, isStreaming: !prev.isStreaming }));
  }, []);

  const handleClearLogs = useCallback(() => {
    setState(prev => ({ ...prev, logs: [], deploymentEvents: [] }));
  }, []);

  const handleExportLogs = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: filteredLogs,
      events: filteredEvents,
      filters: state.filters
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumo-debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs, filteredEvents, state.filters]);

  const updateFilter = useCallback((key: keyof DashboardFilters, value: string | undefined) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value || undefined }
    }));
  }, []);

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      case 'DEBUG': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateDeploymentProgress = (pipeline: DeploymentPipeline): number => {
    if (pipeline.stages.length === 0) return 0;
    const completedStages = pipeline.stages.filter(s => 
      s.status === DeploymentStatus.SUCCESS || s.status === DeploymentStatus.ERROR
    ).length;
    return (completedStages / pipeline.stages.length) * 100;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">LUMO Extreme Debug Dashboard</h1>
            <Badge variant="outline" className="text-green-600 border-green-600">
              {state.isStreaming ? 'LIVE' : 'PAUSED'}
            </Badge>
            {correlationId && (
              <Badge variant="secondary">
                Correlation: {correlationId.slice(0, 8)}...
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStreaming}
              className="flex items-center space-x-1"
            >
              {state.isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{state.isStreaming ? 'Pause' : 'Resume'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Clear</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={state.filters.logLevel || ''} onValueChange={(value) => updateFilter('logLevel', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Correlation ID"
            value={state.filters.correlationId || ''}
            onChange={(e) => updateFilter('correlationId', e.target.value)}
            className="w-48"
          />

          <Input
            placeholder="Deployment ID"
            value={state.filters.deploymentId || ''}
            onChange={(e) => updateFilter('deploymentId', e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 bg-white border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="logs">Live Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="health">Health Checks</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                {/* Active Deployments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Active Deployments</span>
                      <Badge>{state.activeDeployments.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {state.activeDeployments.map(deployment => (
                        <div key={deployment.deploymentId} className="mb-4 p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{deployment.deploymentId.slice(0, 12)}...</span>
                            {STATUS_ICONS[deployment.status]}
                          </div>
                          <Progress value={calculateDeploymentProgress(deployment)} className="mb-2" />
                          <div className="text-sm text-gray-600">
                            {deployment.successfulStages}/{deployment.stages.length} stages completed
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Recent Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Recent Alerts</span>
                      <Badge variant="destructive">{state.alerts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {state.alerts.slice(0, 10).map(alert => (
                        <div key={alert.id} className="mb-3 p-2 border-l-4 border-red-500 bg-red-50">
                          <div className="font-medium text-red-800">{alert.title}</div>
                          <div className="text-sm text-red-600">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>System Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Streaming</span>
                        <Badge variant={state.isStreaming ? "default" : "secondary"}>
                          {state.isStreaming ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Log Entries</span>
                        <Badge variant="outline">{state.logs.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Events</span>
                        <Badge variant="outline">{state.deploymentEvents.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Performance Metrics</span>
                        <Badge variant="outline">{state.performanceMetrics.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deployments" className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Deployment Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full">
                    {filteredEvents.map(event => (
                      <div key={event.eventId} className="mb-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[event.stage]}`} />
                            <span className="font-medium">{event.stage}</span>
                            {STATUS_ICONS[event.status]}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm mb-2">{event.message}</div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>Deploy: {event.deploymentId.slice(0, 8)}...</span>
                          <span>Correlation: {event.correlationId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Live Logs Stream</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full font-mono text-sm">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="mb-1 p-2 border-l-4 border-gray-200 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <Badge className={`text-xs ${getLogLevelColor(log.level)} flex-shrink-0`}>
                            {log.level}
                          </Badge>
                          <span className="text-gray-600 text-xs flex-shrink-0 w-24">
                            {log.source}
                          </span>
                          <span className="flex-1">{log.message}</span>
                          {log.correlationId && (
                            <span className="text-xs text-blue-600 flex-shrink-0">
                              {log.correlationId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.performanceMetrics.slice(0, 12).map(metric => (
                      <div key={`${metric.name}-${metric.timestamp.getTime()}`} className="p-4 border rounded-lg">
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-2xl font-bold text-blue-600">{metric.value.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{metric.unit}</div>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(metric.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Alert History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full">
                    {state.alerts.map(alert => (
                      <div key={alert.id} className="mb-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant={alert.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <div className="text-sm mb-2">{alert.message}</div>
                        <div className="text-xs text-gray-600">
                          {formatTimestamp(alert.timestamp)} • {alert.source}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Health Check History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full">
                    {state.healthChecks.map(check => (
                      <div key={check.checkId} className="mb-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{check.endpoint}</span>
                          <Badge variant={check.status === 'HEALTHY' ? 'default' : 'destructive'}>
                            {check.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Response Time: {check.responseTime}ms
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(check.timestamp)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

// Type guard for log entries
const isLogEntry = (data: unknown): data is LogEntry => {
  return typeof data === 'object' && data !== null && 
         'id' in data && 'timestamp' in data && 'level' in data && 'message' in data;
};

export default RealTimeMonitoringDashboard;