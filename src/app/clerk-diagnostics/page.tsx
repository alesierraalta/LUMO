'use client';

import { useEffect, useState } from 'react';
import { checkClerkConfiguration, isUsingProductionKeys } from '@/lib/clerk-config';

export default function ClerkDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<{
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check configuration
    const config = checkClerkConfiguration();
    setDiagnostics(config);

    // Get environment info (client-safe values only)
    const env = {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
      FORCE_PRODUCTION_ON_LOCALHOST: process.env.FORCE_PRODUCTION_ON_LOCALHOST || 'false',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 15) + '...' || 'not set',
      isProduction: isUsingProductionKeys() ? 'yes' : 'no',
      currentDomain: window.location.hostname,
      currentProtocol: window.location.protocol,
      currentPort: window.location.port,
      testMode: process.env.FORCE_PRODUCTION_ON_LOCALHOST === 'true' && isUsingProductionKeys() ? 'ACTIVE' : 'INACTIVE'
    };
    setEnvVars(env);
  }, []);

  if (!diagnostics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Running diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Clerk Configuration Diagnostics</h1>
      
      {/* Status Overview */}
      <div className={`p-4 rounded-lg border mb-6 ${
        diagnostics.isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          {diagnostics.isValid ? '✅' : '❌'} Configuration Status
        </h2>
        <p className={`${diagnostics.isValid ? 'text-green-700' : 'text-red-700'}`}>
          {diagnostics.isValid 
            ? 'Your Clerk configuration appears to be working correctly.'
            : 'There are issues with your Clerk configuration that need attention.'}
        </p>
      </div>

      {/* Warnings */}
      {diagnostics.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Warnings</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            {diagnostics.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {diagnostics.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Recommendations</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            {diagnostics.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Environment Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Environment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="font-medium text-gray-600">{key}:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{value}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🚀 Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full md:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(envVars, null, 2));
              alert('Environment info copied to clipboard');
            }}
            className="w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Copy Diagnostics
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Need help?</h4>
        <p>
          If you're experiencing issues, try:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><code className="bg-gray-100 px-1 rounded">npm run dev:clerk</code> - Use development keys</li>
          <li><code className="bg-gray-100 px-1 rounded">npm run dev:prod-test</code> - Test production keys on localhost</li>
          <li><code className="bg-gray-100 px-1 rounded">npm run dev:prod-keys</code> - Use production keys (requires proper domain)</li>
        </ul>
      </div>
    </div>
  );
} 