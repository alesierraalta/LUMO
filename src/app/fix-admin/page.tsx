"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser, useClerk } from "@clerk/nextjs";
import { AlertCircle, CheckCircle, RefreshCw, ArrowLeft, UsersRound } from "lucide-react";
import Link from "next/link";

export default function FixAdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === "alesierraalta@gmail.com";

  const handleFixAdmin = async () => {
    if (!isAdmin) {
      setError("Solo el administrador puede realizar esta acción");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/force-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar permisos");
      }

      setSuccess(true);
      
      // Recargar la página después de 2 segundos para refrescar los permisos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllUsers = async () => {
    if (!isAdmin) {
      setSyncError("Solo el administrador puede realizar esta acción");
      return;
    }

    try {
      setSyncLoading(true);
      setSyncError(null);

      const response = await fetch("/api/auth/sync-all-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al sincronizar usuarios");
      }

      setSyncSuccess(true);
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSyncSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error("Error:", error);
      setSyncError(error.message || "Error desconocido");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut(() => { window.location.href = '/'; });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reparar Permisos de Administrador</CardTitle>
          <CardDescription>
            Solución para problemas de permisos con la cuenta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <div className="flex gap-2 items-center">
                <div className="font-medium">Usuario actual:</div>
                <div>{userEmail || "No autenticado"}</div>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <div className="font-medium">Estado:</div>
                {isAdmin ? (
                  <div className="text-primary flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Email de administrador válido</span>
                  </div>
                ) : (
                  <div className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>No es el email de administrador</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-primary/15 text-primary rounded-md p-3 text-sm flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  Permisos de administrador actualizados correctamente. Redirigiendo...
                </div>
              </div>
            )}
            
            {syncError && (
              <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>{syncError}</div>
              </div>
            )}

            {syncSuccess && (
              <div className="bg-primary/15 text-primary rounded-md p-3 text-sm flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  Todos los usuarios sincronizados correctamente.
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="default"
              className="w-full"
              onClick={handleFixAdmin}
              disabled={loading || !isAdmin || success}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Restaurar Permisos de Admin"
              )}
            </Button>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSyncAllUsers}
              disabled={syncLoading || !isAdmin}
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <UsersRound className="mr-2 h-4 w-4" />
                  Sincronizar Todos los Usuarios
                </>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2 w-full">
            <Link href="/" className="w-1/2">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Inicio
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-1/2"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 