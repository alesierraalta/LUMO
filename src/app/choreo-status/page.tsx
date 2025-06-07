'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Types for the API response
interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  autoFixAvailable: boolean;
  autoFixApplied?: boolean;
  autoFixResult?: 'success' | 'failed' | 'partial';
  possibleFixes?: string[];
}

interface DeploymentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: string;
  deploymentId: string;
  environment: string;
  version: string;
  issueCount: number;
  criticalIssues: number;
  highIssues: number;
  metrics: {
    responseTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    databaseConnected?: boolean;
    clerkAuthentication?: boolean;
    environmentComplete?: boolean;
  };
  issues: Issue[];
  recommendations: string;
}

export default function ChoreoStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healing, setHealing] = useState(false);

  // Function to fetch status from API
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/choreo-health');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger self-healing
  const triggerHealing = async () => {
    setHealing(true);
    try {
      const response = await fetch('/api/choreo-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'heal' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger healing: ${response.status} ${response.statusText}`);
      }
      
      // Refetch status after healing
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error triggering healing:', err);
    } finally {
      setHealing(false);
    }
  };

  // Fetch status on initial load
  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Choreo Deployment Status</h1>
        
        {/* Authentication notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This dashboard bypasses normal authentication. For security, bookmark these direct access links:
                <br />
                <a href="/choreo-debug-link" className="font-medium underline">Debug Link</a> | 
                <a href="/debug" className="font-medium underline ml-2">Direct Access</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading and error states */}
      {loading && !status && (
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <p className="text-center text-gray-600">Loading deployment status...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {status && (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Deployment Status</h2>
                <span className={`${getStatusColor(status.status)} text-white text-sm px-3 py-1 rounded-full`}>
                  {status.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 mb-2">ID: {status.deploymentId}</p>
              <p className="text-gray-600 mb-2">Version: {status.version}</p>
              <p className="text-gray-600 mb-2">Environment: {status.environment}</p>
              <p className="text-gray-600">Updated: {formatTimestamp(status.timestamp)}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Issues Summary</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-red-600">{status.criticalIssues}</span>
                  <span className="text-sm text-gray-600">Critical</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-orange-500">{status.highIssues}</span>
                  <span className="text-sm text-gray-600">High</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-blue-500">
                    {status.issueCount - status.criticalIssues - status.highIssues}
                  </span>
                  <span className="text-sm text-gray-600">Other</span>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={triggerHealing}
                  disabled={healing || status.issues.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {healing ? 'Applying Fixes...' : 'Apply Auto-Fixes'}
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-semibold">{status.metrics.responseTime ? `${status.metrics.responseTime}ms` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Usage:</span>
                  <span className="font-semibold">
                    {status.metrics.memoryUsage ? `${Math.round(status.metrics.memoryUsage / 1024 / 1024)}MB` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database:</span>
                  <span className={`font-semibold ${status.metrics.databaseConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {status.metrics.databaseConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Authentication:</span>
                  <span className={`font-semibold ${status.metrics.clerkAuthentication ? 'text-green-600' : 'text-red-600'}`}>
                    {status.metrics.clerkAuthentication ? 'Working' : 'Not Working'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          {status.recommendations && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    {status.recommendations}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Issues List */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Detected Issues</h2>
            </div>
            {status.issues.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                No issues detected! The deployment is healthy.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {status.issues.map(issue => (
                  <div key={issue.id} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{issue.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`${getSeverityColor(issue.severity)} text-white text-xs px-2 py-1 rounded-full`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {issue.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{issue.description}</p>
                    
                    {/* Auto-fix status */}
                    {issue.autoFixAvailable && (
                      <div className="flex items-center mb-3">
                        <span className="text-sm font-medium mr-2">Auto-fix:</span>
                        {issue.autoFixApplied ? (
                          <span className={`text-sm ${issue.autoFixResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {issue.autoFixResult === 'success' ? 'Applied successfully' : 'Failed to apply'}
                          </span>
                        ) : (
                          <span className="text-sm text-blue-600">Available</span>
                        )}
                      </div>
                    )}
                    
                    {/* Possible fixes */}
                    {issue.possibleFixes && issue.possibleFixes.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium mb-1">Suggested fixes:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 pl-2">
                          {issue.possibleFixes.map((fix, index) => (
                            <li key={index}>{fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={fetchStatus}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh Status
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </>
      )}
    </div>
  );
} 