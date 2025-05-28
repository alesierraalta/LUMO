"use client";

import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function AuthErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);

  // Función para verificar la configuración de entorno
  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/debug-env");
      if (response.ok) {
        const data = await response.json();
        setEnvInfo(data);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch environment info:", err);
    }
    return null;
  };

  useEffect(() => {
    // Listen for unhandled auth errors
    const handleError = (event: ErrorEvent) => {
      // Only catch Clerk/auth related errors
      if (
        event.error?.message?.includes("Clerk") ||
        event.error?.message?.includes("ClerkProvider") ||
        event.error?.message?.includes("useUser") ||
        event.error?.message?.includes("useAuth") ||
        event.error?.message?.includes("authentication") ||
        event.error?.message?.includes("Publishable key not valid")
      ) {
        event.preventDefault();
        setHasError(true);
        setError(event.error);
        console.error("Auth error caught by boundary:", event.error);
        
        // Verificar la configuración de entorno cuando ocurre un error
        checkEnvironment();
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error de Autenticación</AlertTitle>
            <AlertDescription className="mt-2">
              {error?.message || "Se ha producido un error en la autenticación."}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground mb-4">
              Este error puede ocurrir cuando:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Las claves de API de autenticación no están configuradas correctamente</li>
                <li>El proveedor de autenticación no está disponible</li>
                <li>Hay un problema con tu sesión de usuario</li>
              </ul>
            </p>
            
            {envInfo && (
              <div className="p-4 border rounded mb-4 bg-muted/30 text-xs">
                <p className="font-bold mb-1">Información de entorno:</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(envInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <Button 
              variant="default" 
              className="gap-2"
              onClick={() => window.location.href = "/"}
            >
              Volver al Inicio
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 mt-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
            
            <Button 
              variant="link" 
              className="gap-2 mt-2"
              onClick={async () => {
                const data = await checkEnvironment();
                if (data) {
                  alert(`Estado del sistema: ${JSON.stringify(data, null, 2)}`);
                } else {
                  alert("No se pudo verificar el estado del sistema");
                }
              }}
            >
              Verificar Estado del Sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 