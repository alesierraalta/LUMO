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
    
    // Special handling for CSS-related errors
    if (error.message?.includes('entryCSSFiles') || 
        error.message?.includes('Cannot read properties of undefined') ||
        error.message?.includes('CSS')) {
      console.error('CSS loading error detected. This might be due to missing CSS manifest files.');
      console.log('Attempting to reload the page to retry CSS loading...');
      
      // Try to reload after a short delay for CSS errors
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          padding: '20px', 
          maxWidth: '600px', 
          margin: '50px auto',
          border: '1px solid #red',
          borderRadius: '8px',
          backgroundColor: '#fef2f2'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            🚨 Application Error
          </h2>
          <p style={{ marginBottom: '16px' }}>
            {error.message?.includes('entryCSSFiles') || error.message?.includes('CSS') 
              ? 'CSS loading error detected. The page will reload automatically in 2 seconds to retry.'
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
              overflow: 'auto'
            }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
            <p>If this error persists:</p>
            <ul>
              <li>Check the server logs for more details</li>
              <li>Verify all environment variables are set correctly</li>
              <li>Ensure the database connection is working</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  );
} 