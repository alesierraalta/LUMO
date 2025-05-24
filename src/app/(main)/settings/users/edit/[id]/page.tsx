import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserRoleForm from "@/components/auth/user-role-form";
import Protected from "@/components/auth/protected";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserRolePage({ params }: PageProps) {
  // Check if the current user is an admin
  const admin = await isAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  const resolvedParams = await params;
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      role: true,
    },
  });

  if (!user) {
    redirect("/settings/users");
  }

  // Get all available roles
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <Protected requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/settings/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit User Role</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Edit user role and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Role</h3>
                <p className="capitalize">{user.role.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                <p>{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <UserRoleForm userId={user.id} currentRoleId={user.role.id} roles={roles} />
          </CardContent>
        </Card>
      </div>
    </Protected>
  );
} 