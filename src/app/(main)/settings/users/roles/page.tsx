'use client';

import { useState, useEffect } from 'react';
import { Shield, Settings, Users, Package, BarChart3, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Definición de permisos disponibles
const availablePermissions: Omit<Permission, 'id'>[] = [
  // Dashboard
  { name: 'dashboard.view', description: 'Ver dashboard', resource: 'dashboard', action: 'view', category: 'page' },
  
  // Inventario
  { name: 'inventory.view', description: 'Ver inventario', resource: 'inventory', action: 'view', category: 'page' },
  { name: 'inventory.create', description: 'Crear productos', resource: 'inventory', action: 'create', category: 'feature' },
  { name: 'inventory.edit', description: 'Editar productos', resource: 'inventory', action: 'edit', category: 'feature' },
  { name: 'inventory.delete', description: 'Eliminar productos', resource: 'inventory', action: 'delete', category: 'feature' },
  
  // Ventas
  { name: 'sales.view', description: 'Ver ventas', resource: 'sales', action: 'view', category: 'page' },
  { name: 'sales.create', description: 'Crear ventas', resource: 'sales', action: 'create', category: 'feature' },
  { name: 'sales.edit', description: 'Editar ventas', resource: 'sales', action: 'edit', category: 'feature' },
  
  // Ubicaciones
  { name: 'locations.view', description: 'Ver ubicaciones', resource: 'locations', action: 'view', category: 'page' },
  { name: 'locations.create', description: 'Crear ubicaciones', resource: 'locations', action: 'create', category: 'feature' },
  { name: 'locations.edit', description: 'Editar ubicaciones', resource: 'locations', action: 'edit', category: 'feature' },
  
  // Categorías
  { name: 'categories.view', description: 'Ver categorías', resource: 'categories', action: 'view', category: 'page' },
  { name: 'categories.create', description: 'Crear categorías', resource: 'categories', action: 'create', category: 'feature' },
  { name: 'categories.edit', description: 'Editar categorías', resource: 'categories', action: 'edit', category: 'feature' },
  
  // Usuarios (solo admin)
  { name: 'users.view', description: 'Ver usuarios', resource: 'users', action: 'view', category: 'admin' },
  { name: 'users.create', description: 'Crear usuarios', resource: 'users', action: 'create', category: 'admin' },
  { name: 'users.edit', description: 'Editar usuarios', resource: 'users', action: 'edit', category: 'admin' },
  { name: 'users.delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete', category: 'admin' },
  
  // Permisos (solo admin)
  { name: 'permissions.view', description: 'Ver permisos', resource: 'permissions', action: 'view', category: 'admin' },
  { name: 'permissions.manage', description: 'Gestionar permisos', resource: 'permissions', action: 'manage', category: 'admin' },
  
  // Configuración
  { name: 'settings.view', description: 'Ver configuración', resource: 'settings', action: 'view', category: 'page' },
  { name: 'settings.edit', description: 'Editar configuración', resource: 'settings', action: 'edit', category: 'feature' },
  
  // Reportes
  { name: 'reports.view', description: 'Ver reportes', resource: 'reports', action: 'view', category: 'page' },
  { name: 'reports.export', description: 'Exportar reportes', resource: 'reports', action: 'export', category: 'feature' }
];

export default function RolePermissionsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [showCreateRole, setShowCreateRole] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadUserAndRoles();
    }
  }, [authLoading]);

  const loadUserAndRoles = async () => {
    try {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a esta sección');
        return;
      }

      // Cargar roles desde localStorage o crear roles por defecto
      const savedRoles = localStorage.getItem('lumo-roles');
      if (savedRoles) {
        setRoles(JSON.parse(savedRoles));
      } else {
        // Crear roles por defecto
        const defaultRoles: Role[] = [
          {
            id: 'admin',
            name: 'ADMIN',
            description: 'Administrador con acceso completo',
            permissions: availablePermissions.map((p, index) => ({ ...p, id: `perm-${index}` }))
          },
          {
            id: 'manager',
            name: 'MANAGER',
            description: 'Gerente con acceso a inventario y ventas',
            permissions: availablePermissions
              .filter(p => !p.category.includes('admin'))
              .map((p, index) => ({ ...p, id: `perm-${index}` }))
          },
          {
            id: 'user',
            name: 'USER',
            description: 'Usuario básico con permisos limitados',
            permissions: availablePermissions
              .filter(p => p.action === 'view' && !p.category.includes('admin'))
              .map((p, index) => ({ ...p, id: `perm-${index}` }))
          }
        ];
        setRoles(defaultRoles);
        localStorage.setItem('lumo-roles', JSON.stringify(defaultRoles));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (role: Role, permissionName: string): boolean => {
    return role.permissions.some(p => p.name === permissionName);
  };

  const togglePermission = (roleId: string, permissionName: string) => {
    setRoles(prevRoles => {
      const updatedRoles = prevRoles.map(role => {
        if (role.id === roleId) {
          const hasPerms = hasPermission(role, permissionName);
          const permission = availablePermissions.find(p => p.name === permissionName);
          
          if (hasPerms) {
            // Remover permiso
            return {
              ...role,
              permissions: role.permissions.filter(p => p.name !== permissionName)
            };
          } else {
            // Agregar permiso
            if (permission) {
              return {
                ...role,
                permissions: [...role.permissions, { ...permission, id: `perm-${Date.now()}` }]
              };
            }
          }
        }
        return role;
      });
      
      // Guardar en localStorage
      localStorage.setItem('lumo-roles', JSON.stringify(updatedRoles));
      return updatedRoles;
    });
    
    toast.success('Permiso actualizado');
  };

  const createRole = () => {
    if (!newRoleName.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName.toUpperCase(),
      description: newRoleDescription,
      permissions: []
    };

    setRoles(prev => {
      const updated = [...prev, newRole];
      localStorage.setItem('lumo-roles', JSON.stringify(updated));
      return updated;
    });

    setNewRoleName('');
    setNewRoleDescription('');
    setShowCreateRole(false);
    toast.success('Rol creado exitosamente');
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'ADMIN') {
      toast.error('No se puede eliminar el rol de administrador');
      return;
    }

    setRoles(prev => {
      const updated = prev.filter(r => r.id !== roleId);
      localStorage.setItem('lumo-roles', JSON.stringify(updated));
      return updated;
    });
    
    toast.success('Rol eliminado');
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar roles y permisos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Permisos</h1>
            <p className="text-muted-foreground">
              Configura qué puede ver y hacer cada rol de usuario
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateRole(!showCreateRole)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Rol
        </Button>
      </div>

      {showCreateRole && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Rol</CardTitle>
            <CardDescription>Define un nuevo rol con permisos personalizados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Rol</label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Ej: SUPERVISOR"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Describe las responsabilidades de este rol"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createRole}>Crear Rol</Button>
              <Button variant="outline" onClick={() => setShowCreateRole(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>{role.name}</span>
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                {role.name !== 'ADMIN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRole(role.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                  <div key={resource} className="space-y-3">
                    <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      {resource}
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {permissions.map((permission) => {
                        const hasAccess = hasPermission(role, permission.name);
                        const isDisabled = role.name === 'ADMIN'; // Admin siempre tiene todos los permisos
                        
                        return (
                          <div
                            key={permission.name}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              hasAccess ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{permission.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {permission.action} • {permission.category}
                              </div>
                            </div>
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={() => !isDisabled && togglePermission(role.id, permission.name)}
                              disabled={isDisabled}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {role.name === 'ADMIN' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> El rol de administrador tiene acceso completo y no puede ser modificado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Los cambios en permisos se aplicarán inmediatamente. 
          Los usuarios deberán cerrar sesión e iniciar sesión nuevamente para que los cambios surtan efecto.
        </AlertDescription>
      </Alert>
    </div>
  );
} 