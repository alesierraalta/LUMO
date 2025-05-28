'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR-BOUNDARY] Error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component'
    });

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to monitoring service if available
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error to monitoring endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
          level: this.props.level || 'component',
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(reportError => {
        console.error('[ERROR-BOUNDARY] Failed to report error:', reportError);
      });
    } catch (reportError) {
      console.error('[ERROR-BOUNDARY] Error reporting failed:', reportError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`[ERROR-BOUNDARY] Retrying (${this.state.retryCount + 1}/${this.maxRetries})`);
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorType = (error: Error): string => {
    if (error.message.includes('entryCSSFiles')) return 'CSS_MANIFEST';
    if (error.message.includes('ChunkLoadError')) return 'CHUNK_LOAD';
    if (error.message.includes('Loading chunk')) return 'CHUNK_LOAD';
    if (error.message.includes('Network')) return 'NETWORK';
    if (error.message.includes('CORS')) return 'CORS';
    return 'UNKNOWN';
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return null;

    const errorType = this.getErrorType(error);
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Bug className="w-4 h-4" />
          <span>Error ID: {errorId}</span>
          <span>•</span>
          <span>Type: {errorType}</span>
        </div>
        
        <div className="text-sm text-red-600 mb-2 font-mono">
          {error.message}
        </div>

        {isDevelopment && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
              {error.stack}
            </pre>
            {errorInfo && (
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                {errorInfo.componentStack}
              </pre>
            )}
          </details>
        )}
      </div>
    );
  };

  private renderFallbackUI = () => {
    const { level = 'component' } = this.props;
    const { retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;

    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Critical Error
              </h1>
              <p className="text-gray-600 mb-6">
                The application encountered a critical error and cannot continue.
              </p>
              
              {this.renderErrorDetails()}
              
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="max-w-md w-full mx-4 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Page Error
            </h2>
            <p className="text-gray-600 mb-4">
              This page encountered an error and couldn't load properly.
            </p>
            
            {this.renderErrorDetails()}
            
            <div className="flex gap-3 justify-center mt-4">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry ({this.maxRetries - retryCount} left)
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Component level error
    return (
      <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
        <div className="flex items-center gap-2 text-orange-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Component Error</span>
        </div>
        <p className="text-orange-700 text-sm mb-3">
          This component encountered an error and couldn't render.
        </p>
        
        {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}
        
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            <RefreshCw className="w-3 h-3" />
            Retry ({this.maxRetries - retryCount} left)
          </button>
        )}
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Specialized error boundaries for different use cases
export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">{children}</ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">{children}</ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">{children}</ErrorBoundary>
); 