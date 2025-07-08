'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Shield, Users, Settings } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  category: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface RolePermissions {
  [roleId: string]: Permission[];
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obtener token de autenticación
      const authToken = localStorage.getItem('auth-token') || 
                       document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      };
      
      // Cargar roles
      const rolesResponse = await fetch('/api/roles', { headers });
      const rolesData = await rolesResponse.json();
      
      // Cargar permisos
      const permissionsResponse = await fetch('/api/permissions', { headers });
      const permissionsData = await permissionsResponse.json();
      
      if (rolesData.roles) {
        setRoles(rolesData.roles);
        
        // Cargar permisos para cada rol
        const rolePermsData: RolePermissions = {};
        for (const role of rolesData.roles) {
          const rolePermsResponse = await fetch(`/api/roles/${role.id}/permissions`, { headers });
          const rolePermsResult = await rolePermsResponse.json();
          rolePermsData[role.id] = rolePermsResult.permissions || [];
        }
        setRolePermissions(rolePermsData);
      }
      
      if (permissionsData.permissions) {
        setPermissions(permissionsData.permissions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error al cargar datos de roles y permisos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (roleId: string, permissionId: string, checked: boolean) => {
    setRolePermissions(prev => {
      const current = prev[roleId] || [];
      if (checked) {
        const permission = permissions.find(p => p.id === permissionId);
        if (permission && !current.find(p => p.id === permissionId)) {
          return { ...prev, [roleId]: [...current, permission] };
        }
      } else {
        return { ...prev, [roleId]: current.filter(p => p.id !== permissionId) };
      }
      return prev;
    });
  };

  const saveRolePermissions = async (roleId: string) => {
    try {
      setSaving(roleId);
      const permissionIds = rolePermissions[roleId]?.map(p => p.id) || [];
      
      // Obtener token de autenticación
      const authToken = localStorage.getItem('auth-token') || 
                       document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({ permissionIds }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Permisos actualizados correctamente",
        });
      } else {
        throw new Error(result.error || 'Error al actualizar permisos');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Error al guardar permisos",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const groupPermissionsByCategory = (perms: Permission[]) => {
    return perms.reduce((acc, permission) => {
      const category = permission.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Settings className="h-4 w-4" />;
      case 'MANAGER':
        return <Shield className="h-4 w-4" />;
      case 'USER':
        return <Users className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'USER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando roles y permisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground">
            Administra los roles y permisos del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue={roles[0]?.id} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {roles.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="flex items-center gap-2">
              {getRoleIcon(role.name)}
              <span>{role.name}</span>
              <Badge variant={getRoleBadgeVariant(role.name)} className="ml-1">
                {rolePermissions[role.id]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getRoleIcon(role.name)}
                    Permisos para {role.name}
                  </CardTitle>
                  <CardDescription>
                    Selecciona los permisos que tendrá este rol
                  </CardDescription>
                </div>
                <Button
                  onClick={() => saveRolePermissions(role.id)}
                  disabled={saving === role.id}
                  className="flex items-center gap-2"
                >
                  {saving === role.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-semibold capitalize">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryPermissions.map((permission) => {
                          const isChecked = rolePermissions[role.id]?.some(p => p.id === permission.id) || false;
                          return (
                            <div key={permission.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                              <Checkbox
                                id={`${role.id}-${permission.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(role.id, permission.id, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${role.id}-${permission.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium">{permission.resource}:{permission.action}</div>
                                  {permission.description && (
                                    <div className="text-xs text-muted-foreground">{permission.description}</div>
                                  )}
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RoleManagement; 