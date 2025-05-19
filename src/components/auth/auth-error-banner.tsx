"use client";

import { useAppAuth } from "@/components/auth/auth-provider";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export function AuthErrorBanner() {
  const { syncError, syncingUser, retrySyncUser } = useAppAuth();
  const { signOut } = useClerk();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const handleSignOut = () => {
    signOut(() => { window.location.href = '/'; });
  };
  
  if (!syncError || isDismissed) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start justify-between w-full">
        <div className="flex gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>
            <AlertTitle>Error de sincronización de usuario</AlertTitle>
            <AlertDescription>
              {syncError}
            </AlertDescription>
            <div className="mt-2 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1"
                onClick={() => retrySyncUser()}
                disabled={syncingUser}
              >
                {syncingUser ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Intentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    Reintentar
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="gap-1"
                onClick={handleSignOut}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setIsDismissed(true)}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
} 