"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

type DebugResult = {
  authorized: boolean;
  debugInfo: {
    error?: string;
    clerkUserId?: string | null;
    userFound?: boolean;
    userEmail?: string;
    role?: string | null;
    requiredRole?: string;
    roleMatches?: boolean;
    isAdminEmail?: boolean;
  };
};

export default function PermissionDebugPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [loading, setLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Función para verificar los permisos con información de depuración
  const checkPermissions = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const response = await fetch("/api/auth/debug-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });
      
      const result = await response.json();
      setDebugResult(result);
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos al cargar la página y cuando cambie el rol seleccionado
  useEffect(() => {
    if (user) {
      checkPermissions();
    }
  }, [selectedRole, user]);

  const handleSignOut = () => {
    signOut(() => { window.location.href = '/'; });
  };

  const handleForceAdmin = async () => {
    try {
      setLoading(true);
      
      const response = await fetch("/api/auth/force-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al forzar rol de administrador");
      }
      
      // Recargar la página después de forzar el rol
      window.location.reload();
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Debug de Permisos</CardTitle>
            <CardDescription>
              Necesitas iniciar sesión para usar esta herramienta
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al Inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Debug de Permisos</CardTitle>
          <CardDescription>
            Herramienta para diagnosticar problemas de permisos y roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <div className="flex gap-2 items-center">
              <div className="font-medium">Usuario actual:</div>
              <div>{user.primaryEmailAddress?.emailAddress || "No disponible"}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Selecciona un rol para verificar:</label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={checkPermissions}
              disabled={loading}
              className="mt-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Permisos"
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {debugResult && (
            <div className="space-y-4">
              <div className={`rounded-md p-4 ${
                debugResult.authorized 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {debugResult.authorized ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h3 className="font-medium">
                    {debugResult.authorized 
                      ? `Autorizado para el rol: ${selectedRole}` 
                      : `No autorizado para el rol: ${selectedRole}`}
                  </h3>
                </div>
                
                {!debugResult.authorized && debugResult.debugInfo.error && (
                  <div className="text-sm mt-1 text-red-600">
                    Error: {debugResult.debugInfo.error}
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-sm font-medium">ClerkID:</div>
                    <div className="text-sm font-mono">
                      {debugResult.debugInfo.clerkUserId || "No disponible"}
                    </div>
                    
                    <div className="text-sm font-medium">Usuario en DB:</div>
                    <div className="flex items-center gap-1">
                      {debugResult.debugInfo.userFound ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span>{debugResult.debugInfo.userFound ? "Encontrado" : "No encontrado"}</span>
                    </div>
                    
                    {debugResult.debugInfo.userEmail && (
                      <>
                        <div className="text-sm font-medium">Email:</div>
                        <div className="text-sm">
                          {debugResult.debugInfo.userEmail}
                          {debugResult.debugInfo.isAdminEmail && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                              Admin Email
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="text-sm font-medium">Rol Actual:</div>
                    <div className="text-sm capitalize">{debugResult.debugInfo.role || "N/A"}</div>
                    
                    <div className="text-sm font-medium">Rol Requerido:</div>
                    <div className="text-sm capitalize">{debugResult.debugInfo.requiredRole || "Ninguno"}</div>
                    
                    {typeof debugResult.debugInfo.roleMatches !== "undefined" && (
                      <>
                        <div className="text-sm font-medium">¿Roles Coinciden?</div>
                        <div className="flex items-center gap-1">
                          {debugResult.debugInfo.roleMatches ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>{debugResult.debugInfo.roleMatches ? "Sí" : "No"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {debugResult.debugInfo.isAdminEmail && !debugResult.authorized && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-medium text-amber-800">
                      Problema detectado con permisos de administrador
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Tu email ({debugResult.debugInfo.userEmail}) es el del administrador, pero tu rol actual es "{debugResult.debugInfo.role}".
                  </p>
                  <Button
                    onClick={handleForceAdmin}
                    disabled={loading}
                    variant="outline"
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Forzar Rol de Administrador"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Inicio</Button>
            </Link>
            {debugResult?.authorized && selectedRole === "admin" && (
              <Link href="/settings/users">
                <Button>Ir a Gestión de Usuarios</Button>
              </Link>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 