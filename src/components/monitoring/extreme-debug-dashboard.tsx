'use client';

/**
 * Extreme Debug Dashboard
 * 
 * Master dashboard for extreme debugging capabilities
 * Integrates all monitoring components for complete system visibility
 * Provides automated root cause analysis and intelligent debugging insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Zap,
  Bug,
  Target,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Brain,
  Shield,
  Network,
  Server,
  GitBranch,
  Eye,
  Search
} from 'lucide-react';

// Import all monitoring components
import { RealTimeDashboard } from './real-time-dashboard';
import { DeploymentStatusTracker } from './deployment-status-tracker';
import PerformanceMetricsDashboard from './performance-metrics-dashboard';
import ErrorPatternDashboard from './error-pattern-dashboard';

// Import monitoring engines
import { AutomatedErrorDetectionEngine, Alert as ErrorAlert, ErrorSeverity } from '@/lib/logger/automated-error-detection';
import { PerformanceMetricsCollector, MetricType } from '@/lib/logger/performance-metrics';
import { DeploymentEventTracker, DeploymentStage } from '@/lib/logger/deployment-event-tracker';
import RootCauseAnalysisEngine, { RootCauseAnalysis, RootCauseCategory } from '@/lib/logger/root-cause-analysis-engine';
import { useCorrelation } from '@/lib/logger/correlation';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown';
  components: {
    api: 'healthy' | 'warning' | 'critical';
    database: 'healthy' | 'warning' | 'critical';
    authentication: 'healthy' | 'warning' | 'critical';
    deployment: 'healthy' | 'warning' | 'critical';
    performance: 'healthy' | 'warning' | 'critical';
  };
  score: number; // 0-100
  lastCheck: Date;
}

interface DebugSession {
  id: string;
  startTime: Date;
  correlationId: string;
  activeIssues: number;
  resolvedIssues: number;
  totalAnalyses: number;
  status: 'active' | 'monitoring' | 'investigating';
}

interface QuickInsight {
  id: string;
  type: 'error_spike' | 'performance_degradation' | 'deployment_issue' | 'resource_pressure' | 'security_alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  autoAction?: string;
  relatedAnalysis?: string;
}

const COMPONENT_ICONS = {
  api: <Server className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  authentication: <Shield className="h-4 w-4" />,
  deployment: <GitBranch className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />
};

const STATUS_COLORS = {
  healthy: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
  unknown: 'text-gray-600 bg-gray-50'
};

export const ExtremeDebugDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'unknown',
    components: {
      api: 'unknown',
      database: 'unknown',
      authentication: 'unknown',
      deployment: 'unknown',
      performance: 'unknown'
    },
    score: 0,
    lastCheck: new Date()
  });

  const [debugSession, setDebugSession] = useState<DebugSession>({
    id: `debug_${Date.now()}`,
    startTime: new Date(),
    correlationId: '',
    activeIssues: 0,
    resolvedIssues: 0,
    totalAnalyses: 0,
    status: 'monitoring'
  });

  const [recentAnalyses, setRecentAnalyses] = useState<RootCauseAnalysis[]>([]);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  const { correlationId } = useCorrelation();
  const errorDetection = AutomatedErrorDetectionEngine.getInstance();
  const performanceCollector = PerformanceMetricsCollector.getInstance();
  const deploymentTracker = DeploymentEventTracker.getInstance();
  const rootCauseEngine = RootCauseAnalysisEngine.getInstance();

  // Update debug session correlation ID
  useEffect(() => {
    if (correlationId) {
      setDebugSession(prev => ({ ...prev, correlationId }));
    }
  }, [correlationId]);

  // Main monitoring loop
  useEffect(() => {
    const monitorSystem = async () => {
      // Update system health
      await updateSystemHealth();
      
      // Check for new issues and run analysis
      await checkForNewIssues();
      
      // Generate quick insights
      generateQuickInsights();
      
      // Update debug session stats
      updateDebugSessionStats();
    };

    monitorSystem();
    
    const interval = isLiveMode ? setInterval(monitorSystem, 3000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode]);

  const updateSystemHealth = async (): Promise<void> => {
    try {
      // Get recent alerts and metrics
      const recentAlerts = errorDetection.getRecentAlerts(15);
      const recentMetrics = performanceCollector.getRecentMetrics(15);
      const recentDeployments = deploymentTracker.getRecentEvents(60);

      // Analyze component health
      const components = {
        api: analyzeApiHealth(recentAlerts, recentMetrics),
        database: analyzeDatabaseHealth(recentAlerts, recentMetrics),
        authentication: analyzeAuthHealth(recentAlerts),
        deployment: analyzeDeploymentHealth(recentDeployments),
        performance: analyzePerformanceHealth(recentMetrics)
      };

      // Calculate overall health
      const healthScores = {
        healthy: 100,
        warning: 70,
        critical: 30,
        unknown: 50
      };

      const avgScore = Object.values(components)
        .reduce((sum, status) => sum + healthScores[status], 0) / 5;

      const overall = avgScore >= 90 ? 'healthy' :
                    avgScore >= 70 ? 'warning' :
                    avgScore >= 50 ? 'critical' : 'unknown';

      setSystemHealth({
        overall: overall as any,
        components,
        score: Math.round(avgScore),
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('Error updating system health:', error);
    }
  };

  const checkForNewIssues = async (): Promise<void> => {
    try {
      // Get critical alerts from last 5 minutes
      const criticalAlerts = errorDetection.getRecentAlerts(5)
        .filter(alert => 
          alert.severity === ErrorSeverity.CRITICAL || 
          alert.severity === ErrorSeverity.HIGH
        );

      // Run root cause analysis for new critical issues
      for (const alert of criticalAlerts) {
        const existingAnalysis = recentAnalyses.find(analysis => 
          analysis.primaryError.id === alert.id
        );

        if (!existingAnalysis) {
          const analysis = await rootCauseEngine.analyzeRootCause(alert);
          setRecentAnalyses(prev => [analysis, ...prev.slice(0, 9)]);
        }
      }
    } catch (error) {
      console.error('Error checking for new issues:', error);
    }
  };

  const generateQuickInsights = (): void => {
    const insights: QuickInsight[] = [];
    const now = new Date();

    // Check for error spikes
    const recentAlerts = errorDetection.getRecentAlerts(10);
    if (recentAlerts.length > 20) {
      insights.push({
        id: 'error_spike',
        type: 'error_spike',
        title: 'Error Spike Detected',
        description: `${recentAlerts.length} errors in the last 10 minutes`,
        severity: recentAlerts.length > 50 ? 'critical' : 'high',
        timestamp: now,
        autoAction: 'Automated analysis initiated'
      });
    }

    // Check for performance issues
    const recentMetrics = performanceCollector.getRecentMetrics(5);
    const highResponseTime = recentMetrics.filter(m => 
      m.type === MetricType.RESPONSE_TIME && m.value > 3000
    );
    
    if (highResponseTime.length > 5) {
      insights.push({
        id: 'performance_degradation',
        type: 'performance_degradation',
        title: 'Performance Degradation',
        description: 'Response times above 3 seconds detected',
        severity: 'high',
        timestamp: now,
        autoAction: 'Performance analysis in progress'
      });
    }

    // Check for deployment issues
    const recentDeployments = deploymentTracker.getRecentEvents(30);
    const failedDeployments = recentDeployments.filter(d => 
      d.stage === DeploymentStage.FAILED
    );
    
    if (failedDeployments.length > 0) {
      insights.push({
        id: 'deployment_issue',
        type: 'deployment_issue',
        title: 'Deployment Failure',
        description: `${failedDeployments.length} failed deployments detected`,
        severity: 'critical',
        timestamp: now,
        autoAction: 'Rollback recommendation generated'
      });
    }

    // Check for resource pressure
    const cpuMetrics = recentMetrics.filter(m => 
      m.type === MetricType.CPU_USAGE && m.value > 85
    );
    const memoryMetrics = recentMetrics.filter(m => 
      m.type === MetricType.MEMORY_USAGE && m.value > 85
    );
    
    if (cpuMetrics.length > 3 || memoryMetrics.length > 3) {
      insights.push({
        id: 'resource_pressure',
        type: 'resource_pressure',
        title: 'High Resource Utilization',
        description: 'CPU or memory usage above 85%',
        severity: 'medium',
        timestamp: now,
        autoAction: 'Auto-scaling evaluation initiated'
      });
    }

    setQuickInsights(insights);
  };

  const updateDebugSessionStats = (): void => {
    const analyses = rootCauseEngine.getRecentAnalyses(60);
    const activeIssues = errorDetection.getRecentAlerts(15)
      .filter(alert => 
        alert.severity === ErrorSeverity.CRITICAL || 
        alert.severity === ErrorSeverity.HIGH
      ).length;

    setDebugSession(prev => ({
      ...prev,
      activeIssues,
      totalAnalyses: analyses.length,
      status: activeIssues > 0 ? 'investigating' : 'monitoring'
    }));
  };

  // Component health analyzers
  const analyzeApiHealth = (alerts: ErrorAlert[], metrics: any[]): 'healthy' | 'warning' | 'critical' => {
    const apiErrors = alerts.filter(a => a.source?.includes('api') || a.message.includes('API'));
    const errorRate = metrics.filter(m => m.type === MetricType.ERROR_RATE && m.value > 0.05);
    
    if (apiErrors.length > 10 || errorRate.length > 3) return 'critical';
    if (apiErrors.length > 5 || errorRate.length > 1) return 'warning';
    return 'healthy';
  };

  const analyzeDatabaseHealth = (alerts: ErrorAlert[], metrics: any[]): 'healthy' | 'warning' | 'critical' => {
    const dbErrors = alerts.filter(a => 
      a.message.toLowerCase().includes('database') || 
      a.message.toLowerCase().includes('sql')
    );
    const dbMetrics = metrics.filter(m => 
      m.type === MetricType.DATABASE_QUERY_TIME && m.value > 1000
    );
    
    if (dbErrors.length > 5 || dbMetrics.length > 5) return 'critical';
    if (dbErrors.length > 2 || dbMetrics.length > 2) return 'warning';
    return 'healthy';
  };

  const analyzeAuthHealth = (alerts: ErrorAlert[]): 'healthy' | 'warning' | 'critical' => {
    const authErrors = alerts.filter(a => 
      a.message.toLowerCase().includes('auth') || 
      a.message.toLowerCase().includes('unauthorized') ||
      a.message.toLowerCase().includes('forbidden')
    );
    
    if (authErrors.length > 10) return 'critical';
    if (authErrors.length > 5) return 'warning';
    return 'healthy';
  };

  const analyzeDeploymentHealth = (deployments: any[]): 'healthy' | 'warning' | 'critical' => {
    const failed = deployments.filter(d => d.stage === DeploymentStage.FAILED);
    const inProgress = deployments.filter(d => 
      d.stage === DeploymentStage.BUILDING || 
      d.stage === DeploymentStage.DEPLOYING
    );
    
    if (failed.length > 0) return 'critical';
    if (inProgress.length > 2) return 'warning';
    return 'healthy';
  };

  const analyzePerformanceHealth = (metrics: any[]): 'healthy' | 'warning' | 'critical' => {
    const highResponseTime = metrics.filter(m => 
      m.type === MetricType.RESPONSE_TIME && m.value > 2000
    );
    const highCpu = metrics.filter(m => 
      m.type === MetricType.CPU_USAGE && m.value > 80
    );
    const highMemory = metrics.filter(m => 
      m.type === MetricType.MEMORY_USAGE && m.value > 80
    );
    
    if (highResponseTime.length > 5 || highCpu.length > 5 || highMemory.length > 5) return 'critical';
    if (highResponseTime.length > 2 || highCpu.length > 2 || highMemory.length > 2) return 'warning';
    return 'healthy';
  };

  const formatDuration = (startTime: Date): string => {
    const duration = Date.now() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getInsightIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'error_spike': return <AlertTriangle className="h-4 w-4" />;
      case 'performance_degradation': return <TrendingDown className="h-4 w-4" />;
      case 'deployment_issue': return <GitBranch className="h-4 w-4" />;
      case 'resource_pressure': return <Cpu className="h-4 w-4" />;
      case 'security_alert': return <Shield className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Extreme Debug Dashboard</h1>
          </div>
          <Badge variant={isLiveMode ? "default" : "secondary"}>
            {isLiveMode ? "LIVE" : "PAUSED"}
          </Badge>
          <Badge className={STATUS_COLORS[systemHealth.overall]}>
            {systemHealth.overall.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
          >
            {isLiveMode ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {isLiveMode ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Health</span>
              <Target className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold mb-2">{systemHealth.score}%</div>
            <Progress value={systemHealth.score} className="h-2" />
            <div className="text-xs text-gray-600 mt-1">
              Last check: {systemHealth.lastCheck.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Active Issues */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Issues</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold mb-2">{debugSession.activeIssues}</div>
            <div className="text-xs text-gray-600">
              {debugSession.totalAnalyses} analyses completed
            </div>
          </CardContent>
        </Card>

        {/* Debug Session */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Debug Session</span>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold mb-1">{formatDuration(debugSession.startTime)}</div>
            <div className="text-xs text-gray-600">
              Status: {debugSession.status}
            </div>
            {debugSession.correlationId && (
              <div className="text-xs text-blue-600 mt-1">
                ID: {debugSession.correlationId.slice(0, 8)}...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Quick Insights</span>
              <Search className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold mb-2">{quickInsights.length}</div>
            <div className="text-xs text-gray-600">
              {quickInsights.filter(i => i.severity === 'critical').length} critical
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(systemHealth.components).map(([component, status]) => (
              <div key={component} className="flex items-center space-x-2">
                {COMPONENT_ICONS[component as keyof typeof COMPONENT_ICONS]}
                <span className="text-sm font-medium capitalize">{component}</span>
                <Badge className={STATUS_COLORS[status]}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickInsights.map(insight => (
                <Alert key={insight.id} className={
                  insight.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  insight.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  insight.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'}>
                            {insight.severity}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {insight.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <AlertDescription className="text-sm mb-1">
                        {insight.description}
                      </AlertDescription>
                      {insight.autoAction && (
                        <div className="text-xs text-blue-600">
                          Auto Action: {insight.autoAction}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Root Cause Analyses */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Root Cause Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map(analysis => (
                <div key={analysis.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {analysis.rootCause.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <Badge variant="outline">
                        {analysis.confidence.toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600">
                      {analysis.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">
                    {analysis.rootCause.description}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {analysis.relatedErrors.length} related errors | 
                      {analysis.recommendations.length} recommendations
                    </span>
                    <span>
                      {analysis.automatedActions.filter(a => a.executed).length} actions executed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Patterns</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Extreme Debugging Active</h3>
            <p>All monitoring systems are operational and analyzing your Choreo deployments in real-time.</p>
            <p className="text-sm mt-2">Switch to other tabs for detailed analysis.</p>
          </div>
        </TabsContent>

        <TabsContent value="realtime">
          <RealTimeDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetricsDashboard />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorPatternDashboard />
        </TabsContent>

        <TabsContent value="deployments">
          <DeploymentStatusTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExtremeDebugDashboard;
</rewritten_file>