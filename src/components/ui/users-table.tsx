"use client";

import { Pencil, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { PermissionButton } from "@/components/auth/permission-guard";

// Define the User type - updated to match API response
type User = {
  id: string;
  email: string;
  name: string;
  role: any; // Allow both string and object
  isActive: boolean;
  createdAt: string; // Como string desde la API
  updatedAt: string; // Como string desde la API
};

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string, isActive: boolean) => void;
}

export function UsersTable({ users, isLoading = false, onDeleteUser, onToggleUserStatus }: UsersTableProps) {
  // Define column configuration for the users table
  const columns = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }: { row: any }) => {
        return row.original.name || "-";
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }: { row: any }) => {
        // Handle both string and object role
        const roleData = row.original.role;
        let roleName = '';
        
        if (typeof roleData === 'string') {
          roleName = roleData;
        } else if (roleData && typeof roleData === 'object') {
          roleName = roleData.name || roleData.id || 'UNKNOWN';
        } else {
          roleName = 'UNKNOWN';
        }
        
        const roleColors = {
          ADMIN: "bg-red-100 text-red-800",
          MANAGER: "bg-blue-100 text-blue-800",
          USER: "bg-gray-100 text-gray-800"
        };
        
        return (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[roleName as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
              {roleName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }: { row: any }) => {
        const isActive = row.original.isActive;
        return (
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="flex items-center gap-1 text-green-600">
                <UserCheck className="w-4 h-4" />
                Activo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <UserX className="w-4 h-4" />
                Inactivo
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Fecha de Creación",
      cell: ({ row }: { row: any }) => {
        // Convertir string a Date para formatear
        const dateStr = row.original.createdAt;
        const date = new Date(dateStr);
        return formatDate(date);
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: { row: any }) => {
        const user = row.original;
        const userRole = typeof user.role === 'string' ? user.role : (user.role?.name || 'USER');
        
        return (
          <div className="flex justify-end gap-2">
            {/* Botón de cambiar estado */}
            {onToggleUserStatus && (
              <PermissionButton 
                permission="users:edit"
                onClick={() => onToggleUserStatus(user.id, user.isActive)}
                variant="outline"
                size="sm"
              >
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 mr-1" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Activar
                  </>
                )}
              </PermissionButton>
            )}
            
            {/* Botón de editar */}
            <PermissionButton permission="users:edit">
              <Link href={`/settings/users/edit/${user.id}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </Link>
            </PermissionButton>
            
            {/* Botón de eliminar */}
            {onDeleteUser && userRole !== 'ADMIN' && (
              <PermissionButton 
                permission="users:delete"
                onClick={() => onDeleteUser(user.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </PermissionButton>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return <DataTable columns={columns} data={users} />;
} 