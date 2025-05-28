"use client";

import { useAppAuth } from "@/components/auth/auth-provider";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export function AuthErrorBanner() {
  const { syncError, syncingUser, retrySyncUser } = useAppAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Verificar si estamos en modo de desarrollo sin autenticación
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  
  // Obtener la función signOut solo si no estamos en modo de desarrollo
  let signOut = () => { window.location.href = '/'; };
  if (!skipAuth) {
    try {
      const clerk = useClerk();
      signOut = () => clerk.signOut(() => { window.location.href = '/'; });
    } catch (error) {
      console.error("Error al obtener useClerk:", error);
    }
  }
  
  // Si estamos en modo de desarrollo o no hay error, no mostrar nada
  if (skipAuth || !syncError || isDismissed) return null;
  
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
                onClick={signOut}
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