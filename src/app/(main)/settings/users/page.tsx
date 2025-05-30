import { UserCog, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "@/components/ui/users-table";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

// Mark as dynamic since we use headers() in auth check
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  if (!prisma) {
    throw new Error("Database not available");
  }

  // Check authentication and admin privileges
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  // Load users data since user is authorized
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex space-x-3">
          <Link href="/settings/users/roles">
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Manage Permissions
            </Button>
          </Link>
          <Link href="/settings/users/new">
            <Button>
              <UserCog className="mr-2 h-4 w-4" />
              New User
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
} 