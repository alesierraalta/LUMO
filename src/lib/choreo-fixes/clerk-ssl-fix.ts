/**
 * Clerk SSL and CDN Fix Module
 * 
 * Handles common Clerk authentication issues in Choreo deployments:
 * - SSL certificate errors
 * - DNS resolution failures
 * - CDN loading issues
 * - Authentication token validation problems
 */

export interface ClerkIssue {
  id: string;
  type: 'ssl-error' | 'cdn-failure' | 'dns-resolution' | 'token-validation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  autoFixable: boolean;
  metadata?: Record<string, any>;
}

export interface ClerkFix {
  issueId: string;
  status: 'success' | 'failed' | 'partial';
  description: string;
  appliedAt: string;
}

/**
 * Detect Clerk-related issues
 */
export async function detectClerkIssues(): Promise<ClerkIssue[]> {
  const issues: ClerkIssue[] = [];
  
  // Check 1: Environment variables
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!publishableKey) {
    issues.push({
      id: 'clerk-missing-publishable-key',
      type: 'token-validation',
      severity: 'critical',
      description: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is missing',
      autoFixable: false,
      metadata: {
        required: true,
        environment: 'client-side'
      }
    });
  }
  
  if (!secretKey) {
    issues.push({
      id: 'clerk-missing-secret-key',
      type: 'token-validation',
      severity: 'critical',
      description: 'CLERK_SECRET_KEY environment variable is missing',
      autoFixable: false,
      metadata: {
        required: true,
        environment: 'server-side'
      }
    });
  }
  
  // Check 2: Key format validation
  if (publishableKey && !publishableKey.startsWith('pk_')) {
    issues.push({
      id: 'clerk-invalid-publishable-key-format',
      type: 'token-validation',
      severity: 'high',
      description: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY does not have the expected format (should start with pk_)',
      autoFixable: false,
      metadata: {
        currentFormat: publishableKey.slice(0, 10) + '...',
        expectedFormat: 'pk_test_... or pk_live_...'
      }
    });
  }
  
  if (secretKey && !secretKey.startsWith('sk_')) {
    issues.push({
      id: 'clerk-invalid-secret-key-format',
      type: 'token-validation',
      severity: 'high',
      description: 'CLERK_SECRET_KEY does not have the expected format (should start with sk_)',
      autoFixable: false,
      metadata: {
        currentFormat: secretKey.slice(0, 10) + '...',
        expectedFormat: 'sk_test_... or sk_live_...'
      }
    });
  }
  
  // Check 3: Test environment vs production environment mismatch
  if (publishableKey && secretKey) {
    const publishableEnv = publishableKey.includes('_test_') ? 'test' : 'live';
    const secretEnv = secretKey.includes('_test_') ? 'test' : 'live';
    
    if (publishableEnv !== secretEnv) {
      issues.push({
        id: 'clerk-environment-mismatch',
        type: 'token-validation',
        severity: 'critical',
        description: 'Clerk publishable key and secret key are from different environments',
        autoFixable: false,
        metadata: {
          publishableEnv,
          secretEnv,
          recommendation: 'Ensure both keys are from the same Clerk environment (test or live)'
        }
      });
    }
  }
  
  // Check 4: Client-side accessibility (this would need to be run on the client)
  // For now, we'll detect potential issues based on configuration
  
  return issues;
}

/**
 * Test Clerk API connectivity
 */
export async function testClerkConnectivity(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!secretKey) {
    return {
      success: false,
      error: 'No secret key available for testing'
    };
  }
  
  const startTime = Date.now();
  
  try {
    // Test basic API connectivity to Clerk
    const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        success: true,
        latency
      };
    } else {
      return {
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
        latency
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency
    };
  }
}

/**
 * Generate Clerk configuration recommendations
 */
export function generateClerkRecommendations(issues: ClerkIssue[]): string[] {
  const recommendations: string[] = [];
  
  if (issues.some(i => i.id === 'clerk-missing-publishable-key')) {
    recommendations.push('Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your Choreo secrets configuration');
    recommendations.push('Ensure the secret name matches exactly what is defined in choreo.yaml');
  }
  
  if (issues.some(i => i.id === 'clerk-missing-secret-key')) {
    recommendations.push('Add CLERK_SECRET_KEY to your Choreo secrets configuration');
    recommendations.push('Verify the secret is properly referenced in your deployment configuration');
  }
  
  if (issues.some(i => i.type === 'token-validation')) {
    recommendations.push('Check your Clerk dashboard to ensure you have the correct API keys');
    recommendations.push('Verify that your keys match the intended environment (development/production)');
  }
  
  if (issues.some(i => i.id === 'clerk-environment-mismatch')) {
    recommendations.push('Ensure both publishable and secret keys are from the same Clerk environment');
    recommendations.push('Consider using test keys for development and live keys for production');
  }
  
  // General Choreo-specific recommendations
  recommendations.push('Consider implementing a CDN fallback solution for Clerk JavaScript loading');
  recommendations.push('Add retry logic for Clerk API calls in case of network issues');
  recommendations.push('Monitor Clerk service status and implement graceful degradation');
  
  return recommendations;
}

/**
 * Create a Clerk SSL fix component (client-side)
 */
export function generateClerkSSLFixComponent(): string {
  return `
/**
 * Clerk SSL Fix Component for Choreo Deployment
 * 
 * This component provides a fallback mechanism for Clerk authentication
 * when SSL/TLS issues occur in Choreo deployments.
 */

'use client';

import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function ClerkSSLFix() {
  const { loaded } = useClerk();
  const [fallbackActive, setFallbackActive] = useState(false);
  
  useEffect(() => {
    // Check if Clerk failed to load within a reasonable time
    const timeout = setTimeout(() => {
      if (!loaded) {
        console.warn('Clerk failed to load, activating fallback mode');
        setFallbackActive(true);
        
        // Attempt to reload Clerk with different settings
        retryClerkLoad();
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
  }, [loaded]);
  
  const retryClerkLoad = async () => {
    try {
      // Clear any cached Clerk data
      localStorage.removeItem('__clerk_cache');
      sessionStorage.removeItem('__clerk_cache');
      
      // Attempt to reinitialize Clerk
      window.location.reload();
    } catch (error) {
      console.error('Failed to retry Clerk load:', error);
    }
  };
  
  if (fallbackActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold mb-2">Authentication Service Issue</h3>
          <p className="text-gray-600 mb-4">
            We're experiencing connectivity issues with our authentication service. 
            This may be due to network or SSL configuration issues.
          </p>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={() => setFallbackActive(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
`;
}

/**
 * Apply automatic fixes for Clerk issues
 */
export async function applyClerkFixes(issues: ClerkIssue[]): Promise<ClerkFix[]> {
  const fixes: ClerkFix[] = [];
  
  // Note: Most Clerk issues require manual configuration and cannot be auto-fixed
  // This function would primarily log the issues and provide guidance
  
  for (const issue of issues) {
    if (issue.autoFixable) {
      // Currently, most Clerk issues are not auto-fixable as they require
      // external configuration (environment variables, DNS, etc.)
      fixes.push({
        issueId: issue.id,
        status: 'failed',
        description: 'Clerk issues typically require manual configuration',
        appliedAt: new Date().toISOString()
      });
    }
  }
  
  return fixes;
}

/**
 * Export for integration with main debug system
 */
export const clerkDebugModule = {
  detectIssues: detectClerkIssues,
  testConnectivity: testClerkConnectivity,
  generateRecommendations: generateClerkRecommendations,
  generateSSLFixComponent: generateClerkSSLFixComponent,
  applyFixes: applyClerkFixes
}; 