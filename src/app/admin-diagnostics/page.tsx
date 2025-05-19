import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDiagnosticsPage() {
  // Obtener información de Clerk
  const user = await currentUser();
  const session = await auth();
  const clerkUserId = session.userId;
  
  // Si no hay usuario autenticado
  if (!user || !clerkUserId) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Error de Diagnóstico</h1>
        <p>No se ha encontrado un usuario autenticado. Por favor, inicia sesión.</p>
        <div className="mt-4">
          <Link href="/">
            <Button>Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Obtener el email principal
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );
  
  // Verificar si el email es el del administrador
  const isAdminEmail = primaryEmail?.emailAddress === "alesierraalta@gmail.com";
  
  // Buscar el usuario en la base de datos
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { 
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    },
  });
  
  // Información sobre roles disponibles
  const roles = await prisma.role.findMany();
  
  // Arreglar el rol si es necesario
  let fixResult = null;
  if (isAdminEmail && dbUser && dbUser.role.name !== "admin") {
    // Buscar el rol de administrador
    const adminRole = roles.find(role => role.name === "admin");
    
    if (adminRole) {
      // Actualizar el rol del usuario
      const updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { roleId: adminRole.id },
        include: { role: true },
      });
      
      fixResult = {
        success: true,
        message: "Rol actualizado automáticamente a 'admin'",
        oldRole: dbUser.role.name,
        newRole: updatedUser.role.name
      };
    }
  }
  
  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Diagnóstico de Administrador</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
          <Link href="/settings/users">
            <Button>Gestión de Usuarios</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Información de Clerk */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Clerk</CardTitle>
            <CardDescription>Datos de la autenticación actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">ID de Clerk:</h3>
              <p className="text-sm font-mono">{clerkUserId}</p>
            </div>
            <div>
              <h3 className="font-medium">Email Principal:</h3>
              <p>{primaryEmail?.emailAddress || "No disponible"}</p>
            </div>
            <div>
              <h3 className="font-medium">Nombre:</h3>
              <p>{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <h3 className="font-medium">¿Email de Administrador?</h3>
              <p className={isAdminEmail ? "text-green-600 font-medium" : "text-red-600"}>
                {isAdminEmail ? "SÍ" : "NO"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Información de la base de datos */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Base de Datos</CardTitle>
            <CardDescription>Datos del usuario en la base de datos interna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dbUser ? (
              <>
                <div>
                  <h3 className="font-medium">ID Interno:</h3>
                  <p className="text-sm font-mono">{dbUser.id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Email en DB:</h3>
                  <p>{dbUser.email}</p>
                </div>
                <div>
                  <h3 className="font-medium">Rol Actual:</h3>
                  <p className="font-medium capitalize">{dbUser.role.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Permisos:</h3>
                  {dbUser.role.permissions.length > 0 ? (
                    <ul className="list-disc list-inside text-sm">
                      {dbUser.role.permissions.map(rp => (
                        <li key={rp.permission.id}>{rp.permission.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No se encontraron permisos específicos
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-amber-600">
                Usuario no encontrado en la base de datos. Es posible que la sincronización haya fallado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Resultado de la corrección automática */}
      {fixResult && (
        <Card className={fixResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          <CardHeader>
            <CardTitle>Corrección Automática</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{fixResult.message}</p>
            {fixResult.oldRole && fixResult.newRole && (
              <p className="mt-2">
                Rol anterior: <span className="font-medium">{fixResult.oldRole}</span> → 
                Nuevo rol: <span className="font-medium">{fixResult.newRole}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Roles disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles en el Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map(role => (
              <div key={role.id} className="p-3 border rounded-md">
                <p className="font-medium capitalize">{role.name}</p>
                <p className="text-xs text-muted-foreground">{role.description || "Sin descripción"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <h3 className="font-medium text-amber-800">Pasos de solución:</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-amber-700">
          <li>Verifica que el email {primaryEmail?.emailAddress} corresponde al administrador</li>
          <li>Confirma que el rol en la base de datos es "admin" (actual: {dbUser?.role.name})</li>
          <li>Si hay inconsistencias, prueba con la herramienta de reparación: <Link href="/fix-admin" className="underline">Reparar Permisos</Link></li>
          <li>Si persiste el problema, intenta cerrar sesión y volver a iniciar</li>
        </ol>
      </div>
    </div>
  );
} 