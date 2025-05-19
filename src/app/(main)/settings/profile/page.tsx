import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { Metadata } from "next";
import { User, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi Perfil | Sistema de Inventario",
  description: "Información de tu cuenta y permisos",
};

export default async function ProfilePage() {
  const userData = await getCurrentUser();
  
  if (!userData) {
    return (
      <div className="text-center py-10">
        <p>No se encontraron datos de usuario. Por favor, inicia sesión nuevamente.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Detalles de tu cuenta en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{userData.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                <p>{`${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ID de Usuario</h3>
                <p className="text-xs text-muted-foreground font-mono">{userData.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Rol y Permisos
            </CardTitle>
            <CardDescription>
              Tu nivel de acceso en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Rol Actual</h3>
                <p className="capitalize font-medium">{userData.role.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Permisos</h3>
                {userData.permissions.length > 0 ? (
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {userData.permissions.map(permission => (
                      <li key={permission} className="text-sm">
                        {permission}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No se encontraron permisos específicos.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 