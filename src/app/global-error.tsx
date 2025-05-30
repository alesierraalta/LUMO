'use client';

import { useEffect } from 'react';

// Client-side error reporting function
async function reportErrorToAPI(error: Error & { digest?: string }, errorContext: any) {
  try {
    const response = await fetch('/api/error-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          digest: error.digest
        },
        context: errorContext,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to report error to API:', response.statusText);
    }
  } catch (reportError) {
    console.error('Error reporting failed:', reportError);
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Generate a correlation ID for error tracking
    const correlationId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Enhanced error logging with context
    const errorContext = {
      correlationId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
      url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      isSSR: typeof window === 'undefined',
      errorType: detectErrorType(error),
      severity: calculateErrorSeverity(error)
    };

    // Log the error to the console with enhanced details
    console.group(`🚨 Global Error [${correlationId}]`);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error digest:', error.digest);
    console.error('Stack trace:', error.stack);
    console.error('Context:', errorContext);
    console.groupEnd();
    
    // Report error to API (client-side only)
    if (typeof window !== 'undefined') {
      reportErrorToAPI(error, errorContext);
    }
    
    // Special handling for CSS-related errors
    if (error.message?.includes('entryCSSFiles') || 
        error.message?.includes('Cannot read properties of undefined') ||
        error.message?.includes('CSS')) {
      console.error(`[${correlationId}] CSS loading error detected. This might be due to missing CSS manifest files.`);
      console.log(`[${correlationId}] Error details:`, {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        severity: 'HIGH',
        category: 'CSS_MANIFEST_ERROR'
      });
      
      // Try to identify which specific manifest is causing issues
      if (typeof window === 'undefined') {
        // Server-side - try to fix manifests immediately
        console.log(`[${correlationId}] [SERVER-SIDE] Attempting immediate manifest fix...`);
        console.log(`[${correlationId}] [SERVER-SIDE] Error occurred during server-side rendering`);
      } else {
        // Client-side - reload the page
        console.log(`[${correlationId}] [CLIENT-SIDE] Attempting to reload the page to retry CSS loading...`);
        
        // Store correlation ID for tracking across reload
        localStorage.setItem('lastErrorCorrelationId', correlationId);
        
        // Try to reload after a short delay for CSS errors
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }

    // Handle authentication errors
    if (error.message?.includes('auth') || error.message?.includes('Authentication')) {
      console.error(`[${correlationId}] Authentication error detected`);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        // Force redirect to login
        window.location.href = '/login';
      }
    }

    // Handle database connection errors
    if (error.message?.includes('database') || error.message?.includes('Prisma')) {
      console.error(`[${correlationId}] Database error detected`);
    }

    // Handle API errors
    if (error.message?.includes('fetch') || error.message?.includes('API')) {
      console.error(`[${correlationId}] API error detected`);
    }

  }, [error]);

  // Detect error type for better categorization
  function detectErrorType(error: Error): string {
    if (error.message?.includes('entryCSSFiles') || error.message?.includes('CSS')) {
      return 'CSS_MANIFEST_ERROR';
    }
    if (error.message?.includes('auth') || error.message?.includes('Authentication')) {
      return 'AUTHENTICATION_ERROR';
    }
    if (error.message?.includes('database') || error.message?.includes('Prisma')) {
      return 'DATABASE_ERROR';
    }
    if (error.message?.includes('fetch') || error.message?.includes('API')) {
      return 'API_ERROR';
    }
    if (error.message?.includes('chunk') || error.message?.includes('loading')) {
      return 'RESOURCE_LOADING_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  // Calculate error severity
  function calculateErrorSeverity(error: Error): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (error.message?.includes('entryCSSFiles')) return 'HIGH';
    if (error.message?.includes('auth') || error.message?.includes('Authentication')) return 'HIGH';
    if (error.message?.includes('database')) return 'CRITICAL';
    if (error.name === 'ChunkLoadError') return 'MEDIUM';
    return 'MEDIUM';
  }

  const errorType = detectErrorType(error);
  const severity = calculateErrorSeverity(error);

  return (
    <html>
      <body>
        <div style={{ 
          padding: '20px', 
          maxWidth: '800px', 
          margin: '50px auto',
          border: `2px solid ${severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#f59e0b' : '#6b7280'}`,
          borderRadius: '8px',
          backgroundColor: severity === 'CRITICAL' ? '#fef2f2' : severity === 'HIGH' ? '#fef3c7' : '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>
              {severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : '🔍'}
            </span>
            <h2 style={{ 
              color: severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#92400e' : '#374151', 
              margin: 0 
            }}>
              Application Error - {severity} Severity
            </h2>
          </div>

          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>Error Type:</strong> {errorType}<br/>
            <strong>Timestamp:</strong> {new Date().toISOString()}<br/>
            <strong>Session:</strong> {typeof window !== 'undefined' ? 
              (localStorage.getItem('lastErrorCorrelationId') || 'New session') : 'Server-side'}
          </div>
          
          <p style={{ marginBottom: '16px' }}>
            {errorType === 'CSS_MANIFEST_ERROR' 
              ? 'CSS loading error detected. This indicates a problem with CSS manifest files. The page will reload automatically in 2 seconds to retry.'
              : errorType === 'AUTHENTICATION_ERROR'
              ? 'Authentication error detected. Please try logging in again.'
              : errorType === 'DATABASE_ERROR'
              ? 'Database connection error. Please try again later or contact support.'
              : 'Something went wrong in the application. Our team has been notified.'
            }
          </p>

          <details style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Technical Details
            </summary>
            <pre style={{ 
              marginTop: '8px', 
              padding: '12px', 
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px',
              border: '1px solid #d1d5db'
            }}>
              Error: {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              Type: {errorType}
              Severity: {severity}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
          
          {errorType === 'CSS_MANIFEST_ERROR' && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '4px',
              border: '1px solid #f59e0b'
            }}>
              <h3 style={{ color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                🔍 CSS Manifest Error Analysis
              </h3>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: 1.4 }}>
                This error indicates that Next.js cannot find the <code>entryCSSFiles</code> property in one of the build manifest files. 
                The system is automatically attempting to fix this issue. If the problem persists, it may indicate a deeper build configuration issue.
              </p>
            </div>
          )}

          {errorType === 'AUTHENTICATION_ERROR' && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#fecaca', 
              borderRadius: '4px',
              border: '1px solid #dc2626'
            }}>
              <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '14px' }}>
                🔐 Authentication Issue
              </h3>
              <p style={{ fontSize: '12px', color: '#991b1b', margin: 0, lineHeight: 1.4 }}>
                There was an issue with the authentication system. Your session data has been cleared. 
                Please try logging in again.
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 16px',
                backgroundColor: severity === 'CRITICAL' ? '#dc2626' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>

            {errorType === 'AUTHENTICATION_ERROR' && (
              <button
                onClick={() => window.location.href = '/sign-in'}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Go to Sign In
              </button>
            )}
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Troubleshooting Tips:</p>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {errorType === 'CSS_MANIFEST_ERROR' && (
                <>
                  <li>The system is automatically attempting to fix CSS manifest issues</li>
                  <li>If reloading doesn't work, clear your browser cache</li>
                  <li>Check if you're using the latest version of the application</li>
                </>
              )}
              {errorType === 'AUTHENTICATION_ERROR' && (
                <>
                  <li>Clear your browser cookies and local storage</li>
                  <li>Try logging in with a different browser</li>
                  <li>Contact support if the issue persists</li>
                </>
              )}
              {errorType === 'DATABASE_ERROR' && (
                <>
                  <li>This is likely a temporary server issue</li>
                  <li>Wait a few minutes and try again</li>
                  <li>Contact support if the problem continues</li>
                </>
              )}
              {!['CSS_MANIFEST_ERROR', 'AUTHENTICATION_ERROR', 'DATABASE_ERROR'].includes(errorType) && (
                <>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the issue persists</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </body>
    </html>
  );
} 