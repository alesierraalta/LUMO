"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/auth";
import PermissionDenied from "@/components/auth/permission-denied";

interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  showPermissionDenied?: boolean;
}

export default function Protected({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  showPermissionDenied = true, // Default to showing permission denied message
}: ProtectedProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuthorization() {
      try {
        // Check if the user has the required role/permission
        const response = await fetch('/api/auth/check-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: requiredRole,
            permission: requiredPermission,
          }),
        });

        const { authorized } = await response.json();
        setIsAuthorized(authorized);

        // If not authorized and no fallback provided and not showing permission denied message, redirect to dashboard
        if (!authorized && !fallback && !showPermissionDenied) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
        
        // If error and no fallback provided and not showing permission denied message, redirect to dashboard
        if (!fallback && !showPermissionDenied) {
          router.push('/dashboard');
        }
      }
    }

    checkAuthorization();
  }, [requiredRole, requiredPermission, router, fallback, showPermissionDenied]);

  // While checking authorization, show loading indicator
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If authorized, show children
  if (isAuthorized) {
    return <>{children}</>;
  }

  // If not authorized but fallback provided, show fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // If not authorized and no fallback, but showing permission denied message
  if (showPermissionDenied) {
    return (
      <PermissionDenied 
        requiredRole={requiredRole} 
        message={
          requiredPermission 
            ? `No tienes el permiso necesario (${requiredPermission}) para acceder a esta página.` 
            : undefined
        }
      />
    );
  }

  // This should not be reached due to the redirect in useEffect
  return null;
} 