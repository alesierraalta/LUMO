'use client';

import React from 'react';
import { Loader2, Package, BarChart3, Users, Settings } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton width="w-12" height="h-12" rounded />
      <div className="space-y-2 flex-1">
        <Skeleton width="w-3/4" height="h-4" />
        <Skeleton width="w-1/2" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="w-full" height="h-3" />
      <Skeleton width="w-5/6" height="h-3" />
      <Skeleton width="w-4/6" height="h-3" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4,
  className = ''
}) => (
  <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} width="w-24" height="h-4" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-3 border-b border-gray-200 last:border-b-0">
        <div className="flex space-x-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} width="w-20" height="h-4" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface PageLoadingProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'Loading Page',
  description = 'Please wait while we load your content...',
  icon,
  showProgress = false,
  progress = 0
}) => (
  <div className="min-h-[400px] flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || <LoadingSpinner size="lg" />}
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
          <span className="sr-only">{progress}% complete</span>
        </div>
      )}
      
      <div className="flex justify-center">
        <LoadingSpinner size="sm" />
      </div>
    </div>
  </div>
);

// Specialized loading components for different sections
export const DashboardLoading: React.FC = () => (
  <PageLoading
    title="Loading Dashboard"
    description="Preparing your inventory overview..."
    icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
  />
);

export const ProductsLoading: React.FC = () => (
  <PageLoading
    title="Loading Products"
    description="Fetching your product catalog..."
    icon={<Package className="w-8 h-8 text-blue-600" />}
  />
);

export const UsersLoading: React.FC = () => (
  <PageLoading
    title="Loading Users"
    description="Retrieving user information..."
    icon={<Users className="w-8 h-8 text-blue-600" />}
  />
);

export const SettingsLoading: React.FC = () => (
  <PageLoading
    title="Loading Settings"
    description="Preparing configuration options..."
    icon={<Settings className="w-8 h-8 text-blue-600" />}
  />
);

// Full page loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  children
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{message}</p>
          {typeof progress === 'number' && (
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// Inline loading states
export const InlineLoading: React.FC<{ 
  size?: 'sm' | 'md';
  text?: string;
  className?: string;
}> = ({ 
  size = 'sm', 
  text = 'Loading...', 
  className = '' 
}) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <LoadingSpinner size={size} />
    <span className="text-gray-600 text-sm">{text}</span>
  </div>
);

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={`relative ${className}`}
  >
    {isLoading ? (
      <div className="flex items-center justify-center space-x-2">
        <LoadingSpinner size="sm" />
        <span>{loadingText}</span>
      </div>
    ) : (
      children
    )}
  </button>
);

// List loading state
export const ListLoading: React.FC<{ 
  items?: number; 
  showHeader?: boolean;
  className?: string;
}> = ({ 
  items = 5, 
  showHeader = false,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {showHeader && (
      <div className="flex justify-between items-center pb-4 border-b">
        <Skeleton width="w-32" height="h-6" />
        <Skeleton width="w-24" height="h-8" />
      </div>
    )}
    
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
        <Skeleton width="w-10" height="h-10" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
        <Skeleton width="w-16" height="h-6" />
      </div>
    ))}
  </div>
);

// Error fallback loading (for when loading fails)
export const ErrorFallbackLoading: React.FC<{
  onRetry?: () => void;
  message?: string;
}> = ({ 
  onRetry,
  message = 'Failed to load content'
}) => (
  <div className="text-center py-8">
    <div className="text-gray-500 mb-4">{message}</div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
      >
        <LoadingSpinner size="sm" />
        Retry
      </button>
    )}
  </div>
); 