"use client";

import { useClerk } from "@clerk/nextjs";
import { AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface PermissionDeniedProps {
  message?: string;
  requiredRole?: string;
}

export default function PermissionDenied({ 
  message = "No tienes permiso para acceder a esta página.", 
  requiredRole
}: PermissionDeniedProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === "alesierraalta@gmail.com";
  
  const handleSignOut = () => {
    signOut(() => { window.location.href = '/'; });
  };
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Acceso Denegado
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            {requiredRole && (
              <p>
                Se requiere el rol <strong className="capitalize">{requiredRole}</strong> para acceder.
              </p>
            )}
            <p>
              Si crees que deberías tener acceso, por favor contacta al administrador del sistema.
            </p>
            
            {isAdmin && (
              <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800">
                <p className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Detectamos que eres el administrador
                </p>
                <p className="mt-1 text-xs">
                  Parece que hay un problema con tus permisos. Puedes intentar repararlos usando la herramienta de reparación.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex justify-end gap-2 w-full">
            {isAdmin && (
              <Link href="/fix-admin">
                <Button variant="default">
                  Reparar Permisos
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
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