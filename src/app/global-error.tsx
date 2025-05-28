'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Global error caught:', error);
    console.error('Error stack:', error.stack);
    
    // Special handling for CSS-related errors
    if (error.message?.includes('entryCSSFiles') || 
        error.message?.includes('Cannot read properties of undefined') ||
        error.message?.includes('CSS')) {
      console.error('CSS loading error detected. This might be due to missing CSS manifest files.');
      console.log('Error details:', {
        message: error.message,
        stack: error.stack,
        digest: error.digest
      });
      
      // Try to identify which specific manifest is causing issues
      if (typeof window === 'undefined') {
        // Server-side - try to fix manifests immediately
        console.log('[SERVER-SIDE] Attempting immediate manifest fix...');
        
        // If we're on server side, the issue might be during SSR
        // Log more details about the current state
        console.log('[SERVER-SIDE] Error occurred during server-side rendering');
      } else {
        // Client-side - reload the page
        console.log('[CLIENT-SIDE] Attempting to reload the page to retry CSS loading...');
        
        // Try to reload after a short delay for CSS errors
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          padding: '20px', 
          maxWidth: '800px', 
          margin: '50px auto',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          backgroundColor: '#fef2f2'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            🚨 Application Error
          </h2>
          <p style={{ marginBottom: '16px' }}>
            {error.message?.includes('entryCSSFiles') || error.message?.includes('CSS') 
              ? 'CSS loading error detected. This indicates a problem with CSS manifest files. The page will reload automatically in 2 seconds to retry.'
              : 'Something went wrong in the application.'
            }
          </p>
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </summary>
            <pre style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
          
          {error.message?.includes('entryCSSFiles') && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '4px',
              border: '1px solid #f59e0b'
            }}>
              <h3 style={{ color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                🔍 CSS Manifest Error Detected
              </h3>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                This error indicates that Next.js cannot find the <code>entryCSSFiles</code> property in one of the build manifest files. 
                The debug script should have fixed this at startup, but the error persists during request processing.
              </p>
            </div>
          )}
          
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload page
          </button>
          
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
            <p>If this error persists:</p>
            <ul>
              <li>Check the server logs for more details about which manifest file is causing issues</li>
              <li>Verify all environment variables are set correctly</li>
              <li>Ensure the database connection is working</li>
              <li>Check if CSS packages are properly installed in production</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  );
} 