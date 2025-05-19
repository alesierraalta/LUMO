"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import PermissionDenied from "@/components/auth/permission-denied";

interface ProtectedAdminProps {
  children: React.ReactNode;
}

export default function ProtectedAdmin({ children }: ProtectedAdminProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAuthorization() {
      try {
        // Primero, verificación rápida del lado del cliente basada en el email
        if (!isLoaded || !user) {
          setIsAuthorized(false);
          return;
        }

        const userEmail = user.primaryEmailAddress?.emailAddress;
        
        // Si el email es el del administrador, podemos autorizar inmediatamente en el cliente
        if (userEmail === "alesierraalta@gmail.com") {
          setIsAuthorized(true);
          return;
        }

        // De lo contrario, verificar con el servidor
        const response = await fetch('/api/auth/debug-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: "admin",
          }),
        });

        const result = await response.json();
        setIsAuthorized(result.authorized);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      }
    }

    if (isLoaded) {
      checkAdminAuthorization();
    }
  }, [isLoaded, user, router]);

  // While loading user or checking authorization, show loading indicator
  if (!isLoaded || isAuthorized === null) {
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

  // If not authorized, show permission denied page
  return (
    <PermissionDenied 
      requiredRole="admin" 
      message="No tienes permiso para acceder a esta página de administración."
    />
  );
} 