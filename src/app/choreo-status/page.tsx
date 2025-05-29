'use client';

import { useEffect, useState } from 'react';

interface SystemStatus {
  database: boolean;
  environment: boolean;
  clerk: boolean;
  application: boolean;
}

interface DebugInfo {
  hostname: string;
  isChoreo: boolean;
  clerkMockActive: boolean;
  environmentVars: Record<string, string>;
  authState: any;
}

export default function ChoreoStatusPage() {
  const [status, setStatus] = useState<SystemStatus>({
    database: false,
    environment: false,
    clerk: false,
    application: false
  });
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const runStatusChecks = async () => {
      addLog('🚀 Starting Choreo status checks...');
      
      // Gather debug info
      const info: DebugInfo = {
        hostname: window.location.hostname,
        isChoreo: window.location.hostname.includes('.choreoapps.dev'),
        clerkMockActive: !!(window as any).__CLERK_FALLBACK_ACTIVE__,
        environmentVars: {
          NODE_ENV: process.env.NODE_ENV || 'unknown',
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
          NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false'
        },
        authState: {
          clerkExists: !!(window as any).Clerk,
          clerkVersion: (window as any).Clerk?.version || 'N/A',
          authDebugExists: !!(window as any).__AUTH_DEBUG__
        }
      };
      setDebugInfo(info);
      
      // Check environment
      addLog('📋 Checking environment configuration...');
      const envOk = info.environmentVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'SET';
      setStatus(prev => ({ ...prev, environment: envOk }));
      addLog(envOk ? '✅ Environment: OK' : '❌ Environment: Missing Clerk key');
      
      // Check database
      addLog('🗄️ Testing database connection...');
      try {
        const dbResponse = await fetch('/api/choreo-db');
        const dbResult = await dbResponse.json();
        const dbOk = dbResult.status === 'success';
        setStatus(prev => ({ ...prev, database: dbOk }));
        addLog(dbOk ? '✅ Database: Connected' : '❌ Database: Connection failed');
      } catch (error) {
        addLog('❌ Database: Connection error');
        setStatus(prev => ({ ...prev, database: false }));
      }
      
      // Check Clerk
      addLog('🔐 Testing Clerk authentication...');
      try {
        const clerkResponse = await fetch('/api/clerk-debug');
        const clerkResult = await clerkResponse.json();
        const clerkOk = clerkResult.status === 'success' || info.clerkMockActive;
        setStatus(prev => ({ ...prev, clerk: clerkOk }));
        addLog(clerkOk ? '✅ Clerk: Available (Mock or Real)' : '❌ Clerk: Not available');
      } catch (error) {
        const fallbackOk = info.clerkMockActive;
        setStatus(prev => ({ ...prev, clerk: fallbackOk }));
        addLog(fallbackOk ? '✅ Clerk: Fallback active' : '❌ Clerk: No fallback');
      }
      
      // Check application health
      addLog('🏥 Testing application health...');
      try {
        const healthResponse = await fetch('/api/health-advanced');
        const healthResult = await healthResponse.json();
        const appOk = healthResult.status === 'healthy';
        setStatus(prev => ({ ...prev, application: appOk }));
        addLog(appOk ? '✅ Application: Healthy' : '❌ Application: Issues detected');
      } catch (error) {
        addLog('❌ Application: Health check failed');
        setStatus(prev => ({ ...prev, application: false }));
      }
      
      addLog('🏁 Status checks complete!');
      setLoading(false);
    };

    runStatusChecks();
  }, []);

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? '✅' : '❌';
  };

  const getStatusColor = (isOk: boolean) => {
    return isOk ? 'text-green-600' : 'text-red-600';
  };

  const testClerkFallback = async () => {
    addLog('🧪 Testing Clerk fallback...');
    try {
      const response = await fetch('/api/clerk-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_auth' })
      });
      const result = await response.json();
      addLog(result.status === 'success' ? '✅ Clerk test: Success' : '❌ Clerk test: Failed');
    } catch (error) {
      addLog('❌ Clerk test: Error');
    }
  };

  const activateClerkMock = () => {
    addLog('🎭 Activating Clerk mock manually...');
    if ((window as any).__AUTH_DEBUG__?.getAuthState) {
      const authState = (window as any).__AUTH_DEBUG__.getAuthState();
      addLog(`📊 Current auth state: ${JSON.stringify(authState)}`);
    }
    window.location.href = '/sign-in';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Choreo Deployment Status
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive system health check for LUMO Inventory
            </p>
          </div>

          <div className="p-6">
            {/* System Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status.database)}</span>
                  <div>
                    <h3 className="font-medium">Database</h3>
                    <p className={`text-sm ${getStatusColor(status.database)}`}>
                      {status.database ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status.environment)}</span>
                  <div>
                    <h3 className="font-medium">Environment</h3>
                    <p className={`text-sm ${getStatusColor(status.environment)}`}>
                      {status.environment ? 'Configured' : 'Issues'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status.clerk)}</span>
                  <div>
                    <h3 className="font-medium">Authentication</h3>
                    <p className={`text-sm ${getStatusColor(status.clerk)}`}>
                      {status.clerk ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status.application)}</span>
                  <div>
                    <h3 className="font-medium">Application</h3>
                    <p className={`text-sm ${getStatusColor(status.application)}`}>
                      {status.application ? 'Healthy' : 'Issues'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-3">🔍 Debug Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
                    <div><strong>Is Choreo:</strong> {debugInfo.isChoreo ? 'Yes' : 'No'}</div>
                    <div><strong>Clerk Mock:</strong> {debugInfo.clerkMockActive ? 'Active' : 'Inactive'}</div>
                    <div><strong>Clerk Exists:</strong> {debugInfo.authState.clerkExists ? 'Yes' : 'No'}</div>
                    <div><strong>Clerk Version:</strong> {debugInfo.authState.clerkVersion}</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-3">🌍 Environment Variables</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(debugInfo.environmentVars).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={testClerkFallback}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🧪 Test Clerk Fallback
              </button>
              <button
                onClick={activateClerkMock}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                🎭 Activate Auth Mock
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📊 Go to Dashboard
              </a>
              <a
                href="/api/health-advanced"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                🏥 Health Check API
              </a>
            </div>

            {/* Live Logs */}
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
              <h3 className="text-white mb-2">📝 Live Status Logs</h3>
              <div className="h-48 overflow-y-auto">
                {loading && <div>⏳ Running status checks...</div>}
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 