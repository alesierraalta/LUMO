'use client';

/**
 * Error Pattern Analysis Dashboard
 * 
 * Advanced error pattern analysis and root cause identification
 * Intelligent error categorization, trend analysis, and debugging insights
 * Integrates with error detection engine for comprehensive analysis
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Bug,
  Zap,
  Clock,
  Target,
  FileText,
  Database,
  Server,
  Network,
  Shield,
  Code,
  Users,
  Settings
} from 'lucide-react';

import { 
  AutomatedErrorDetectionEngine, 
  Alert as ErrorAlert,
  ErrorCategory,
  ErrorSeverity,
  ResolutionStrategy 
} from '@/lib/logger/automated-error-detection';
import { ErrorCategorizationEngine, CategorizedError } from '@/lib/logger/error-categorization';
import { useCorrelation } from '@/lib/logger/correlation';

interface ErrorPattern {
  id: string;
  pattern: string;
  category: ErrorCategory;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  severity: ErrorSeverity;
  affectedEndpoints: string[];
  correlationIds: string[];
  resolution?: ResolutionStrategy;
  examples: string[];
}

interface ErrorInsight {
  id: string;
  title: string;
  description: string;
  category: ErrorCategory;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  automatedFix?: string;
  relatedPatterns: string[];
}

interface ErrorTrend {
  category: ErrorCategory;
  hourlyCount: number[];
  percentageChange: number;
  severity: ErrorSeverity;
  topErrors: string[];
}

const ERROR_CATEGORY_ICONS: Record<ErrorCategory, React.ReactNode> = {
  [ErrorCategory.AUTHENTICATION]: <Shield className="h-4 w-4" />,
  [ErrorCategory.AUTHORIZATION]: <Users className="h-4 w-4" />,
  [ErrorCategory.VALIDATION]: <FileText className="h-4 w-4" />,
  [ErrorCategory.DATABASE]: <Database className="h-4 w-4" />,
  [ErrorCategory.NETWORK]: <Network className="h-4 w-4" />,
  [ErrorCategory.EXTERNAL_SERVICE]: <Server className="h-4 w-4" />,
  [ErrorCategory.CONFIGURATION]: <Settings className="h-4 w-4" />,
  [ErrorCategory.PERFORMANCE]: <Zap className="h-4 w-4" />,
  [ErrorCategory.BUSINESS_LOGIC]: <Code className="h-4 w-4" />,
  [ErrorCategory.SYSTEM]: <Bug className="h-4 w-4" />,
  [ErrorCategory.SECURITY]: <Shield className="h-4 w-4" />,
  [ErrorCategory.RATE_LIMITING]: <Target className="h-4 w-4" />,
  [ErrorCategory.UNKNOWN]: <AlertTriangle className="h-4 w-4" />
};

const ERROR_CATEGORY_COLORS: Record<ErrorCategory, string> = {
  [ErrorCategory.AUTHENTICATION]: 'text-red-600 bg-red-50',
  [ErrorCategory.AUTHORIZATION]: 'text-orange-600 bg-orange-50',
  [ErrorCategory.VALIDATION]: 'text-yellow-600 bg-yellow-50',
  [ErrorCategory.DATABASE]: 'text-blue-600 bg-blue-50',
  [ErrorCategory.NETWORK]: 'text-purple-600 bg-purple-50',
  [ErrorCategory.EXTERNAL_SERVICE]: 'text-indigo-600 bg-indigo-50',
  [ErrorCategory.CONFIGURATION]: 'text-gray-600 bg-gray-50',
  [ErrorCategory.PERFORMANCE]: 'text-green-600 bg-green-50',
  [ErrorCategory.BUSINESS_LOGIC]: 'text-cyan-600 bg-cyan-50',
  [ErrorCategory.SYSTEM]: 'text-pink-600 bg-pink-50',
  [ErrorCategory.SECURITY]: 'text-red-700 bg-red-100',
  [ErrorCategory.RATE_LIMITING]: 'text-orange-700 bg-orange-100',
  [ErrorCategory.UNKNOWN]: 'text-gray-500 bg-gray-50'
};

const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  [ErrorSeverity.LOW]: 'text-green-600 bg-green-50',
  [ErrorSeverity.MEDIUM]: 'text-yellow-600 bg-yellow-50',
  [ErrorSeverity.HIGH]: 'text-orange-600 bg-orange-50',
  [ErrorSeverity.CRITICAL]: 'text-red-600 bg-red-50',
  [ErrorSeverity.UNKNOWN]: 'text-gray-600 bg-gray-50'
};

export const ErrorPatternDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<ErrorAlert[]>([]);
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [insights, setInsights] = useState<ErrorInsight[]>([]);
  const [trends, setTrends] = useState<ErrorTrend[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);

  const { correlationId } = useCorrelation();
  const errorDetection = AutomatedErrorDetectionEngine.getInstance();
  const errorCategorization = ErrorCategorizationEngine.getInstance();

  // Load error data
  useEffect(() => {
    const loadData = () => {
      const timeRangeHours = parseInt(timeRange.replace('h', '').replace('d', '')) * (timeRange.includes('d') ? 24 : 1);
      
      // Get recent alerts
      const recentAlerts = errorDetection.getRecentAlerts(timeRangeHours * 60);
      setAlerts(recentAlerts);
      
      // Analyze patterns
      const analyzedPatterns = analyzeErrorPatterns(recentAlerts);
      setPatterns(analyzedPatterns);
      
      // Generate insights
      const generatedInsights = generateErrorInsights(analyzedPatterns, recentAlerts);
      setInsights(generatedInsights);
      
      // Calculate trends
      const calculatedTrends = calculateErrorTrends(recentAlerts, timeRangeHours);
      setTrends(calculatedTrends);
    };

    loadData();
    
    const interval = isLive ? setInterval(loadData, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, isLive]);

  // Analyze error patterns from alerts
  const analyzeErrorPatterns = (alerts: ErrorAlert[]): ErrorPattern[] => {
    const patternMap = new Map<string, ErrorPattern>();

    alerts.forEach(alert => {
      // Extract pattern from error message
      const pattern = extractErrorPattern(alert.message);
      const key = `${alert.category}-${pattern}`;

      if (patternMap.has(key)) {
        const existing = patternMap.get(key)!;
        existing.frequency++;
        existing.lastSeen = alert.timestamp;
        existing.correlationIds.push(alert.correlationId || '');
        existing.examples.push(alert.message);
        
        // Update affected endpoints
        if (alert.source && !existing.affectedEndpoints.includes(alert.source)) {
          existing.affectedEndpoints.push(alert.source);
        }
      } else {
        patternMap.set(key, {
          id: key,
          pattern,
          category: alert.category,
          frequency: 1,
          firstSeen: alert.timestamp,
          lastSeen: alert.timestamp,
          trend: 'stable',
          severity: alert.severity,
          affectedEndpoints: alert.source ? [alert.source] : [],
          correlationIds: [alert.correlationId || ''],
          examples: [alert.message]
        });
      }
    });

    // Calculate trends for each pattern
    const patterns = Array.from(patternMap.values());
    patterns.forEach(pattern => {
      const recentAlerts = alerts.filter(a => 
        a.category === pattern.category && 
        extractErrorPattern(a.message) === pattern.pattern
      );
      
      pattern.trend = calculatePatternTrend(recentAlerts);
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  };

  // Extract error pattern from message
  const extractErrorPattern = (message: string): string => {
    // Remove specific IDs, timestamps, and variable data
    return message
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '[UUID]')
      .replace(/\b\d+\b/g, '[NUMBER]')
      .replace(/\/[a-zA-Z0-9_-]+/g, '/[PATH]')
      .replace(/"[^"]*"/g, '"[STRING]"')
      .slice(0, 100);
  };

  // Calculate pattern trend
  const calculatePatternTrend = (alerts: ErrorAlert[]): 'increasing' | 'decreasing' | 'stable' => {
    if (alerts.length < 4) return 'stable';
    
    const sortedAlerts = alerts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const midpoint = Math.floor(sortedAlerts.length / 2);
    const firstHalf = sortedAlerts.slice(0, midpoint);
    const secondHalf = sortedAlerts.slice(midpoint);
    
    const firstHalfRate = firstHalf.length / (firstHalf.length > 0 ? 
      (firstHalf[firstHalf.length - 1].timestamp.getTime() - firstHalf[0].timestamp.getTime()) / 3600000 : 1);
    const secondHalfRate = secondHalf.length / (secondHalf.length > 0 ? 
      (secondHalf[secondHalf.length - 1].timestamp.getTime() - secondHalf[0].timestamp.getTime()) / 3600000 : 1);
    
    const change = (secondHalfRate - firstHalfRate) / firstHalfRate;
    
    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  };

  // Generate error insights
  const generateErrorInsights = (patterns: ErrorPattern[], alerts: ErrorAlert[]): ErrorInsight[] => {
    const insights: ErrorInsight[] = [];

    // High frequency error patterns
    const highFrequencyPatterns = patterns.filter(p => p.frequency > 10);
    if (highFrequencyPatterns.length > 0) {
      insights.push({
        id: 'high-frequency-errors',
        title: 'High Frequency Error Patterns',
        description: `${highFrequencyPatterns.length} error patterns occurring frequently`,
        category: highFrequencyPatterns[0].category,
        impact: 'high',
        recommendation: 'Focus on resolving the most frequent error patterns first',
        relatedPatterns: highFrequencyPatterns.slice(0, 3).map(p => p.id)
      });
    }

    // Increasing error trends
    const increasingPatterns = patterns.filter(p => p.trend === 'increasing');
    if (increasingPatterns.length > 0) {
      insights.push({
        id: 'increasing-error-trends',
        title: 'Increasing Error Trends',
        description: `${increasingPatterns.length} error patterns showing increasing trends`,
        category: increasingPatterns[0].category,
        impact: 'critical',
        recommendation: 'Investigate recent changes that might be causing error rate increases',
        relatedPatterns: increasingPatterns.slice(0, 3).map(p => p.id)
      });
    }

    // Critical errors
    const criticalPatterns = patterns.filter(p => p.severity === ErrorSeverity.CRITICAL);
    if (criticalPatterns.length > 0) {
      insights.push({
        id: 'critical-errors',
        title: 'Critical Error Patterns',
        description: `${criticalPatterns.length} critical error patterns detected`,
        category: criticalPatterns[0].category,
        impact: 'critical',
        recommendation: 'Immediate attention required for critical error patterns',
        relatedPatterns: criticalPatterns.slice(0, 3).map(p => p.id)
      });
    }

    // Authentication/Authorization issues
    const authPatterns = patterns.filter(p => 
      p.category === ErrorCategory.AUTHENTICATION || p.category === ErrorCategory.AUTHORIZATION
    );
    if (authPatterns.length > 0 && authPatterns.reduce((sum, p) => sum + p.frequency, 0) > 20) {
      insights.push({
        id: 'auth-issues',
        title: 'Authentication/Authorization Issues',
        description: 'High number of authentication and authorization errors detected',
        category: ErrorCategory.AUTHENTICATION,
        impact: 'high',
        recommendation: 'Review authentication configuration and user access patterns',
        automatedFix: 'Check JWT token expiration and refresh token logic',
        relatedPatterns: authPatterns.slice(0, 3).map(p => p.id)
      });
    }

    // Database connection issues
    const dbPatterns = patterns.filter(p => p.category === ErrorCategory.DATABASE);
    if (dbPatterns.length > 0 && dbPatterns.some(p => p.pattern.includes('connection'))) {
      insights.push({
        id: 'database-connection-issues',
        title: 'Database Connection Issues',
        description: 'Database connection errors detected',
        category: ErrorCategory.DATABASE,
        impact: 'critical',
        recommendation: 'Check database connection pool configuration and network connectivity',
        automatedFix: 'Increase connection pool size and add connection retry logic',
        relatedPatterns: dbPatterns.filter(p => p.pattern.includes('connection')).map(p => p.id)
      });
    }

    return insights;
  };

  // Calculate error trends
  const calculateErrorTrends = (alerts: ErrorAlert[], timeRangeHours: number): ErrorTrend[] => {
    const trends: ErrorTrend[] = [];
    const categories = Object.values(ErrorCategory);

    categories.forEach(category => {
      const categoryAlerts = alerts.filter(a => a.category === category);
      if (categoryAlerts.length === 0) return;

      // Calculate hourly distribution
      const hourlyCount = new Array(Math.min(24, timeRangeHours)).fill(0);
      const hoursPerBucket = timeRangeHours / hourlyCount.length;
      
      categoryAlerts.forEach(alert => {
        const hoursAgo = (Date.now() - alert.timestamp.getTime()) / (1000 * 60 * 60);
        const bucketIndex = Math.floor(hoursAgo / hoursPerBucket);
        if (bucketIndex >= 0 && bucketIndex < hourlyCount.length) {
          hourlyCount[bucketIndex]++;
        }
      });

      // Calculate percentage change
      const recent = hourlyCount.slice(0, Math.floor(hourlyCount.length / 2)).reduce((a, b) => a + b, 0);
      const older = hourlyCount.slice(Math.floor(hourlyCount.length / 2)).reduce((a, b) => a + b, 0);
      const percentageChange = older > 0 ? ((recent - older) / older) * 100 : 0;

      // Get top errors
      const errorCounts = new Map<string, number>();
      categoryAlerts.forEach(alert => {
        const pattern = extractErrorPattern(alert.message);
        errorCounts.set(pattern, (errorCounts.get(pattern) || 0) + 1);
      });
      const topErrors = Array.from(errorCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([pattern]) => pattern);

      // Determine severity
      const severities = categoryAlerts.map(a => a.severity);
      const severity = severities.includes(ErrorSeverity.CRITICAL) ? ErrorSeverity.CRITICAL :
                     severities.includes(ErrorSeverity.HIGH) ? ErrorSeverity.HIGH :
                     severities.includes(ErrorSeverity.MEDIUM) ? ErrorSeverity.MEDIUM :
                     ErrorSeverity.LOW;

      trends.push({
        category,
        hourlyCount,
        percentageChange,
        severity,
        topErrors
      });
    });

    return trends.filter(t => t.hourlyCount.reduce((a, b) => a + b, 0) > 0)
                 .sort((a, b) => b.hourlyCount.reduce((a, b) => a + b, 0) - a.hourlyCount.reduce((a, b) => a + b, 0));
  };

  // Filter patterns based on search and category
  const filteredPatterns = useMemo(() => {
    return patterns.filter(pattern => {
      if (selectedCategory !== 'all' && pattern.category !== selectedCategory) return false;
      if (searchTerm && !pattern.pattern.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [patterns, selectedCategory, searchTerm]);

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrendIcon = (trend: string): React.ReactNode => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Error Pattern Analysis</h2>
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="3d">3 days</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
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

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search error patterns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ErrorCategory | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(ErrorCategory).map(category => (
              <SelectItem key={category} value={category}>
                {category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4">
            {filteredPatterns.map(pattern => (
              <Card key={pattern.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {ERROR_CATEGORY_ICONS[pattern.category]}
                      <Badge className={ERROR_CATEGORY_COLORS[pattern.category]}>
                        {pattern.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={SEVERITY_COLORS[pattern.severity]}>
                        {pattern.severity}
                      </Badge>
                      {getTrendIcon(pattern.trend)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Frequency: {pattern.frequency}</span>
                      <span>First: {formatTimestamp(pattern.firstSeen)}</span>
                      <span>Last: {formatTimestamp(pattern.lastSeen)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-medium mb-1">Error Pattern</h4>
                    <code className="text-sm bg-gray-100 p-2 rounded block">
                      {pattern.pattern}
                    </code>
                  </div>
                  
                  {pattern.affectedEndpoints.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Affected Endpoints</h5>
                      <div className="flex flex-wrap gap-1">
                        {pattern.affectedEndpoints.slice(0, 5).map(endpoint => (
                          <Badge key={endpoint} variant="outline" className="text-xs">
                            {endpoint}
                          </Badge>
                        ))}
                        {pattern.affectedEndpoints.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{pattern.affectedEndpoints.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h5 className="font-medium text-sm mb-1">Recent Examples</h5>
                    <ScrollArea className="h-20">
                      {pattern.examples.slice(0, 3).map((example, index) => (
                        <div key={index} className="text-xs text-gray-600 mb-1">
                          {example}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  
                  {pattern.resolution && (
                    <div>
                      <h5 className="font-medium text-sm mb-1">Recommended Resolution</h5>
                      <div className="text-sm text-blue-600">
                        {pattern.resolution.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {filteredPatterns.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center text-gray-500">
                    <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No error patterns found</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            insights.map(insight => (
              <Alert key={insight.id} className={
                insight.impact === 'critical' ? 'border-red-500 bg-red-50' :
                insight.impact === 'high' ? 'border-orange-500 bg-orange-50' :
                insight.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }>
                <div className="flex items-start space-x-3">
                  {ERROR_CATEGORY_ICONS[insight.category]}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{insight.category.replace(/_/g, ' ')}</Badge>
                        <Badge variant={
                          insight.impact === 'critical' ? 'destructive' :
                          insight.impact === 'high' ? 'default' :
                          'secondary'
                        }>
                          {insight.impact} impact
                        </Badge>
                      </div>
                    </div>
                    
                    <AlertDescription className="text-sm mb-2">
                      {insight.description}
                    </AlertDescription>
                    
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Recommendation: {insight.recommendation}
                    </div>
                    
                    {insight.automatedFix && (
                      <div className="text-sm text-blue-600">
                        Automated Fix: {insight.automatedFix}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No error insights available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            {trends.map(trend => (
              <Card key={trend.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {ERROR_CATEGORY_ICONS[trend.category]}
                      <span>{trend.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <Badge className={SEVERITY_COLORS[trend.severity]}>
                        {trend.severity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {trend.percentageChange > 10 ? <TrendingUp className="h-4 w-4 text-red-500" /> :
                       trend.percentageChange < -10 ? <TrendingDown className="h-4 w-4 text-green-500" /> :
                       <Clock className="h-4 w-4 text-gray-500" />}
                      <span className="text-sm">
                        {trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange.toFixed(1)}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2">Hourly Distribution</h5>
                    <div className="h-8 flex items-end space-x-1">
                      {trend.hourlyCount.map((count, index) => (
                        <div
                          key={index}
                          className="bg-blue-200 flex-1 min-w-0"
                          style={{ height: `${(count / Math.max(...trend.hourlyCount)) * 100}%` }}
                          title={`${count} errors`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-2">Top Error Patterns</h5>
                    <div className="space-y-1">
                      {trend.topErrors.map((error, index) => (
                        <div key={index} className="text-xs text-gray-600 truncate">
                          {index + 1}. {error}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <ScrollArea className="h-96">
            {alerts.slice(0, 50).map(alert => (
              <Card key={alert.id} className="mb-3">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {ERROR_CATEGORY_ICONS[alert.category]}
                      <Badge className={ERROR_CATEGORY_COLORS[alert.category]}>
                        {alert.category.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={SEVERITY_COLORS[alert.severity]}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-1 font-medium">{alert.title}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                  
                  {alert.correlationId && (
                    <div className="text-xs text-blue-600 mt-1">
                      Correlation ID: {alert.correlationId}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorPatternDashboard;
 