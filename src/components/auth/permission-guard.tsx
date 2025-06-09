'use client';

import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions-client';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // Si es true, requiere todos los permisos. Si es false, requiere al menos uno
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = true,
  fallback,
  showAlert = true,
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!user) {
    if (fallback) return <>{fallback}</>;
    
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Debes iniciar sesión para acceder a esta sección.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  } else {
    // Si no se especifica ningún permiso, denegar acceso
    hasAccess = false;
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos suficientes para acceder a esta sección.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

interface PermissionButtonProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  permission,
  permissions,
  requireAll = true,
  className = '',
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Button
      className={className}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  );
};

// Hook para usar permisos en componentes
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    hasPermission: (permission: string) => {
      return hasPermission(user, permission);
    },
    hasAllPermissions: (permissions: string[]) => {
      return hasAllPermissions(user, permissions);
    },
    hasAnyPermission: (permissions: string[]) => {
      return hasAnyPermission(user, permissions);
    },
    user,
  };
}; 