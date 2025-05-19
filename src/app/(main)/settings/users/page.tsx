import { UserCog } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProtectedAdmin from "@/components/auth/protected-admin";
import { UsersTable } from "@/components/ui/users-table";
import { prisma } from "@/lib/prisma";
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";

export default async function UsersPage() {
  // Verificar permisos antes de cargar los datos
  const authCheck = await checkPermissionsWithDebug("admin");
  
  // Solo cargar los datos si el usuario está autorizado
  const users = authCheck.authorized 
    ? await prisma.user.findMany({
        include: {
          role: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link href="/settings/users/new">
          <Button disabled={!authCheck.authorized}>
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and their roles
            {!authCheck.authorized && (
              <span className="block mt-2 text-sm text-yellow-600">
                Necesitas permisos de administrador para ver esta información
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
} 