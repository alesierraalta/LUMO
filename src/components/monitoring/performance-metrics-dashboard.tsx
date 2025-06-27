'use client';

/**
 * Performance Metrics Dashboard
 * 
 * Advanced performance metrics visualization for extreme debugging
 * Real-time charts, trend analysis, and performance insights
 * Integrates with performance collector for live data
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Timer,
  Cpu,
  MemoryStick,
  HardDrive,
  Network
} from 'lucide-react';

import { 
  PerformanceMetricsCollector, 
  PerformanceMetric, 
  MetricType,
  ThresholdViolation 
} from '@/lib/logger/performance-metrics';
import { PerformanceThresholdMonitor } from '@/lib/logger/performance-threshold-monitoring';

interface PerformanceChartData {
  timestamp: Date;
  value: number;
  threshold?: number;
  violation?: boolean;
}

interface MetricSummary {
  name: string;
  type: MetricType;
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  violations: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface PerformanceInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
}

const METRIC_ICONS: Record<MetricType, React.ReactNode> = {
  [MetricType.RESPONSE_TIME]: <Clock className="h-4 w-4" />,
  [MetricType.THROUGHPUT]: <Activity className="h-4 w-4" />,
  [MetricType.ERROR_RATE]: <AlertTriangle className="h-4 w-4" />,
  [MetricType.CPU_USAGE]: <Cpu className="h-4 w-4" />,
  [MetricType.MEMORY_USAGE]: <MemoryStick className="h-4 w-4" />,
  [MetricType.DISK_USAGE]: <HardDrive className="h-4 w-4" />,
  [MetricType.NETWORK_IO]: <Network className="h-4 w-4" />,
  [MetricType.DATABASE_QUERY_TIME]: <Timer className="h-4 w-4" />,
  [MetricType.CACHE_HIT_RATE]: <Zap className="h-4 w-4" />,
  [MetricType.ACTIVE_CONNECTIONS]: <Activity className="h-4 w-4" />
};

const METRIC_COLORS: Record<MetricType, string> = {
  [MetricType.RESPONSE_TIME]: 'text-blue-600',
  [MetricType.THROUGHPUT]: 'text-green-600',
  [MetricType.ERROR_RATE]: 'text-red-600',
  [MetricType.CPU_USAGE]: 'text-orange-600',
  [MetricType.MEMORY_USAGE]: 'text-purple-600',
  [MetricType.DISK_USAGE]: 'text-yellow-600',
  [MetricType.NETWORK_IO]: 'text-cyan-600',
  [MetricType.DATABASE_QUERY_TIME]: 'text-indigo-600',
  [MetricType.CACHE_HIT_RATE]: 'text-emerald-600',
  [MetricType.ACTIVE_CONNECTIONS]: 'text-pink-600'
};

export const PerformanceMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [violations, setViolations] = useState<ThresholdViolation[]>([]);
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [selectedMetric, setSelectedMetric] = useState<MetricType | 'all'>('all');
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [isLive, setIsLive] = useState(true);

  const performanceCollector = PerformanceMetricsCollector.getInstance();
  const thresholdMonitor = PerformanceThresholdMonitor.getInstance();

  // Load performance data
  useEffect(() => {
    const loadData = () => {
      const timeRangeMinutes = parseInt(timeRange.replace('m', '').replace('h', '')) * (timeRange.includes('h') ? 60 : 1);
      const recentMetrics = performanceCollector.getRecentMetrics(timeRangeMinutes);
      const recentViolations = thresholdMonitor.getRecentViolations(timeRangeMinutes);
      
      setMetrics(recentMetrics);
      setViolations(recentViolations);
      generateInsights(recentMetrics, recentViolations);
    };

    loadData();
    
    const interval = isLive ? setInterval(loadData, 2000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, isLive]);

  // Generate performance insights
  const generateInsights = (metrics: PerformanceMetric[], violations: ThresholdViolation[]) => {
    const insights: PerformanceInsight[] = [];

    // Analyze error rate trends
    const errorRateMetrics = metrics.filter(m => m.type === MetricType.ERROR_RATE);
    if (errorRateMetrics.length > 5) {
      const recent = errorRateMetrics.slice(-5);
      const trend = recent[recent.length - 1].value - recent[0].value;
      if (trend > 0.05) {
        insights.push({
          id: 'error-rate-increase',
          title: 'Increasing Error Rate',
          description: `Error rate has increased by ${(trend * 100).toFixed(1)}% in recent measurements`,
          severity: 'critical',
          metric: 'Error Rate',
          recommendation: 'Check recent deployments and error logs for root cause',
          impact: 'high'
        });
      }
    }

    // Analyze response time patterns
    const responseTimeMetrics = metrics.filter(m => m.type === MetricType.RESPONSE_TIME);
    if (responseTimeMetrics.length > 10) {
      const recent = responseTimeMetrics.slice(-10);
      const average = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const p95 = recent.sort((a, b) => a.value - b.value)[Math.floor(recent.length * 0.95)].value;
      
      if (p95 > average * 2) {
        insights.push({
          id: 'response-time-spike',
          title: 'Response Time Spike',
          description: `P95 response time (${p95.toFixed(0)}ms) is significantly higher than average (${average.toFixed(0)}ms)`,
          severity: 'warning',
          metric: 'Response Time',
          recommendation: 'Check for performance bottlenecks in database queries or external services',
          impact: 'medium'
        });
      }
    }

    // Analyze resource utilization
    const cpuMetrics = metrics.filter(m => m.type === MetricType.CPU_USAGE);
    const memoryMetrics = metrics.filter(m => m.type === MetricType.MEMORY_USAGE);
    
    if (cpuMetrics.length > 0 && memoryMetrics.length > 0) {
      const avgCpu = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      
      if (avgCpu > 80 && avgMemory > 80) {
        insights.push({
          id: 'resource-pressure',
          title: 'High Resource Utilization',
          description: `Both CPU (${avgCpu.toFixed(1)}%) and Memory (${avgMemory.toFixed(1)}%) are running high`,
          severity: 'critical',
          metric: 'System Resources',
          recommendation: 'Consider scaling up resources or optimizing application performance',
          impact: 'high'
        });
      }
    }

    // Analyze threshold violations
    if (violations.length > 0) {
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
      if (criticalViolations > 0) {
        insights.push({
          id: 'threshold-violations',
          title: 'Critical Threshold Violations',
          description: `${criticalViolations} critical threshold violations detected`,
          severity: 'critical',
          metric: 'Thresholds',
          recommendation: 'Review threshold violations and take immediate action',
          impact: 'high'
        });
      }
    }

    setInsights(insights);
  };

  // Calculate metric summaries
  const metricSummaries = useMemo(() => {
    const summaries: MetricSummary[] = [];
    const metricTypes = Object.values(MetricType);

    metricTypes.forEach(type => {
      const typeMetrics = metrics.filter(m => m.type === type);
      if (typeMetrics.length === 0) return;

      const values = typeMetrics.map(m => m.value);
      const current = values[values.length - 1];
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate trend
      const recentValues = values.slice(-5);
      const trend = recentValues.length >= 2 ? 
        (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0] : 0;
      
      const trendDirection = Math.abs(trend) < 0.05 ? 'stable' : trend > 0 ? 'up' : 'down';
      
      // Count violations for this metric
      const metricViolations = violations.filter(v => v.metricName.includes(type)).length;
      
      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (metricViolations > 0) {
        status = violations.some(v => v.severity === 'CRITICAL') ? 'critical' : 'warning';
      }

      summaries.push({
        name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        type,
        current,
        average,
        min,
        max,
        trend: trendDirection,
        violations: metricViolations,
        unit: typeMetrics[0].unit,
        status
      });
    });

    return summaries;
  }, [metrics, violations]);

  // Filter metrics for chart display
  const filteredMetrics = useMemo(() => {
    if (selectedMetric === 'all') return metrics;
    return metrics.filter(m => m.type === selectedMetric);
  }, [metrics, selectedMetric]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data: Record<string, PerformanceChartData[]> = {};
    
    filteredMetrics.forEach(metric => {
      if (!data[metric.type]) {
        data[metric.type] = [];
      }
      
      data[metric.type].push({
        timestamp: metric.timestamp,
        value: metric.value,
        violation: violations.some(v => 
          v.metricName.includes(metric.type) && 
          Math.abs(v.timestamp.getTime() - metric.timestamp.getTime()) < 60000
        )
      });
    });

    return data;
  }, [filteredMetrics, violations]);

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'ms') return `${value.toFixed(0)}ms`;
    if (unit === 'req/s') return `${value.toFixed(1)} req/s`;
    if (unit === 'MB') return `${value.toFixed(1)}MB`;
    return `${value.toFixed(2)} ${unit}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string): React.ReactNode => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Performance Metrics</h2>
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? "LIVE" : "PAUSED"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              {Object.values(MetricType).map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Metric Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metricSummaries.map(summary => (
              <Card key={summary.type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {METRIC_ICONS[summary.type]}
                      <span className="font-medium text-sm">{summary.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(summary.trend)}
                      <Badge className={getStatusColor(summary.status)}>
                        {summary.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatValue(summary.current, summary.unit)}
                      </div>
                      <div className="text-xs text-gray-600">Current</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="font-medium">{formatValue(summary.average, summary.unit)}</div>
                        <div className="text-gray-600">Avg</div>
                      </div>
                      <div>
                        <div className="font-medium">{formatValue(summary.min, summary.unit)}</div>
                        <div className="text-gray-600">Min</div>
                      </div>
                      <div>
                        <div className="font-medium">{formatValue(summary.max, summary.unit)}</div>
                        <div className="text-gray-600">Max</div>
                      </div>
                    </div>
                    
                    {summary.violations > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{summary.violations} violations</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization would be implemented with a charting library like Recharts or Chart.js</p>
                  <p className="text-sm mt-1">Showing {filteredMetrics.length} data points over {timeRange}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            insights.map(insight => (
              <Alert key={insight.id} className={
                insight.severity === 'critical' ? 'border-red-500 bg-red-50' :
                insight.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }>
                <div className="flex items-start space-x-3">
                  {insight.severity === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" /> :
                   insight.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" /> :
                   <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{insight.metric}</Badge>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                    </div>
                    
                    <AlertDescription className="text-sm mb-2">
                      {insight.description}
                    </AlertDescription>
                    
                    <div className="text-sm font-medium text-gray-700">
                      Recommendation: {insight.recommendation}
                    </div>
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No performance issues detected</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          {violations.length > 0 ? (
            violations.map(violation => (
              <Card key={violation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{violation.metricName}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={violation.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                        {violation.severity}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {violation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Value: {formatValue(violation.actualValue, violation.unit)} | 
                    Threshold: {formatValue(violation.thresholdValue, violation.unit)}
                  </div>
                  
                  <Progress 
                    value={(violation.actualValue / violation.thresholdValue) * 100} 
                    className="h-2"
                  />
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No threshold violations</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMetricsDashboard;