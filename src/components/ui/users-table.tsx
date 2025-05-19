"use client";

import { Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";

// Define the User type
type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: {
    name: string;
  };
  createdAt: Date;
};

// Define column configuration for the users table
const columns = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: { row: any }) => {
      const firstName = row.original.firstName || "";
      const lastName = row.original.lastName || "";
      return `${firstName} ${lastName}`.trim() || "-";
    },
  },
  {
    accessorKey: "role.name",
    header: "Role",
    cell: ({ row }: { row: any }) => {
      const roleName = row.original.role.name;
      return (
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="capitalize">{roleName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: { row: any }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      return (
        <div className="flex justify-end">
          <Link href={`/settings/users/edit/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit user</span>
            </Button>
          </Link>
        </div>
      );
    },
  },
];

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return <DataTable columns={columns} data={users} />;
} 