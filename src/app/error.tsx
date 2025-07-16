'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error details for debugging
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Send error to monitoring service (if available)
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: window.navigator.userAgent
          })
        }).catch(console.error);
      } catch (e) {
        console.error('Failed to send error report:', e);
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Error de Aplicación
        </h1>
        
        <div className="text-sm text-gray-600 text-center mb-4">
          <p><strong>Severidad:</strong> MEDIA</p>
          <p><strong>Tipo de Error:</strong> {error.digest ? 'SERVER_ERROR' : 'CLIENT_ERROR'}</p>
          <p><strong>Fecha y Hora:</strong> {new Date().toISOString()}</p>
          <p><strong>Sesión:</strong> error-{Date.now()}-{Math.random().toString(36).substr(2, 9)}</p>
        </div>

        <p className="text-gray-700 text-center mb-6">
          Ha ocurrido un error inesperado. Estamos trabajando para resolverlo. 
          Por favor, inténtalo de nuevo más tarde.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Intentar nuevamente
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            Volver al inicio
          </Button>
        </div>

        <details className="mt-6">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
            <p><strong>Message:</strong> {error.message}</p>
            {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
            <p><strong>Stack:</strong></p>
            <pre className="whitespace-pre-wrap">{error.stack}</pre>
          </div>
        </details>

        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Troubleshooting Tips:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Check your internet connection</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}