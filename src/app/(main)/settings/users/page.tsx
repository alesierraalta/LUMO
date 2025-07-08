import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserPlus, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios - LUMO',
  description: 'Administra usuarios y configuraciones del sistema',
};

export default function UsersSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestión de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios
            </CardTitle>
            <CardDescription>
              Administra los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crear, editar y gestionar usuarios del sistema
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/settings/users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Ver Usuarios
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings/users/new" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuevo Usuario
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles y Permisos
            </CardTitle>
            <CardDescription>
              Configura roles y permisos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Administra qué pueden hacer los usuarios según su rol
            </p>
            <Button asChild>
              <Link href="/settings/users/roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Gestionar Roles
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Configuraciones generales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configuraciones de seguridad y sistema
            </p>
            <Button variant="outline" asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Ver Configuración
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información de Roles Actuales */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>
            Información sobre los roles disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-red-500" />
                <h3 className="font-semibold">ADMIN</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso completo al sistema. Puede gestionar usuarios, configuraciones y todos los recursos.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold">MANAGER</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestión operativa. Puede administrar inventario, categorías, ubicaciones y reportes.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">USER</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso de solo lectura. Puede ver inventario, categorías y generar reportes básicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 