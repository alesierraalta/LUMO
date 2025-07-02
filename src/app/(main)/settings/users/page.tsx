'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserCheck, UserX, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsersTable } from '@/components/ui/users-table';
import { PermissionGuard, PermissionButton } from '@/components/auth/permission-guard';
import { supabaseApiClient } from '@/lib/supabase-api-client';
import Link from 'next/link';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    isActive: boolean;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await supabaseApiClient.get('/api/users');
      if (response.data) {
        setUsers(response.data.users || []);
      } else {
        console.error('API Error:', response.error);
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await supabaseApiClient.delete(`/api/users/${userId}`);
      
      if (response.data) {
        toast.success('Usuario eliminado exitosamente');
        loadUsers(); // Recargar la lista
      } else {
        console.error('Delete Error:', response.error);
        toast.error('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await supabaseApiClient.patch(`/api/users/${userId}`, {
        isActive: !isActive
      });

      if (response.data) {
        toast.success(isActive ? 'Usuario desactivado' : 'Usuario activado');
        loadUsers(); // Recargar la lista
      } else {
        console.error('Toggle Status Error:', response.error);
        toast.error('Error al cambiar estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  // Filtrar usuarios basado en búsqueda y filtro de rol
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role?.name === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <PermissionGuard permission="users:view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <PermissionGuard permission="users:admin" showAlert={false}>
              <Link href="/settings/users/roles">
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Gestionar Roles
                </Button>
              </Link>
            </PermissionGuard>
            
            <PermissionGuard permission="users:create" showAlert={false}>
              <Link href="/settings/users/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Usuario
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gerente</option>
              <option value="USER">Usuario</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total Usuarios</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">Usuarios Activos</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role?.name === 'ADMIN').length}
            </div>
            <div className="text-sm text-muted-foreground">Administradores</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role?.name === 'MANAGER').length}
            </div>
            <div className="text-sm text-muted-foreground">Gerentes</div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-card rounded-lg border">
          <UsersTable 
            users={filteredUsers}
            isLoading={isLoading}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
          />
        </div>

        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {searchTerm || roleFilter !== 'all' 
                ? 'No se encontraron usuarios que coincidan con los filtros' 
                : 'No hay usuarios registrados'
              }
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
} 