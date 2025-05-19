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

export default async function UsersPage() {
  // Fetch all users with their roles
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ProtectedAdmin>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Link href="/settings/users/new">
            <Button>
              Add User
            </Button>
          </Link>
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
    </ProtectedAdmin>
  );
} 