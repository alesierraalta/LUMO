"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface LimitedAdminAccessProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export default function LimitedAdminAccess({ children, fallback }: LimitedAdminAccessProps) {
  const { user, isLoaded } = useUser();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAuthorization() {
      try {
        // Check if user is loaded and exists
        if (!isLoaded || !user) {
          setIsAuthorized(false);
          return;
        }

        const userEmail = user.primaryEmailAddress?.emailAddress;
        
        // Direct client-side check for administrator
        if (userEmail === "alesierraalta@gmail.com") {
          setIsAuthorized(true);
          return;
        }

        // Server-side verification
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
  }, [isLoaded, user]);

  // While loading user or checking authorization, show loading indicator
  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If authorized, show children with real data
  if (isAuthorized) {
    return <>{children}</>;
  }

  // If not authorized, show the fallback UI with empty data
  return <>{fallback}</>;
} 