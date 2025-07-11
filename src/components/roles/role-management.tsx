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

  // Enhanced helper function to get Supabase auth headers with comprehensive debugging
  const getAuthHeaders = async () => {
    try {
      console.log('🔍 [RoleManagement] Getting auth headers...');
      
      const { getSupabaseClient } = await import('@/lib/supabase-singleton');
      const supabase = getSupabaseClient();
      
      console.log('✅ [RoleManagement] Supabase client obtained');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔍 [RoleManagement] Session data:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        error: error?.message
      });
      
      if (error) {
        console.error('❌ [RoleManagement] Session error:', error);
        // Don't throw in development mode - use fallback
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [RoleManagement] Development mode - using fallback headers');
          return {
            'Content-Type': 'application/json',
            'X-Development-Mode': 'true'
          };
        }
        throw new Error(`Session error: ${error.message}`);
      }
      
      if (!session) {
        console.error('❌ [RoleManagement] No session found');
        
        // Development mode fallback - allow requests without authentication
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [RoleManagement] Development mode - no session, using fallback headers');
          return {
            'Content-Type': 'application/json',
            'X-Development-Mode': 'true'
          };
        }
        
        throw new Error('No active session');
      }
      
      if (!session.access_token) {
        console.error('❌ [RoleManagement] No access token in session');
        
        // Development mode fallback
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [RoleManagement] Development mode - no access token, using fallback headers');
          return {
            'Content-Type': 'application/json',
            'X-Development-Mode': 'true'
          };
        }
        
        throw new Error('No access token in session');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      };
      
      console.log('✅ [RoleManagement] Auth headers created successfully');
      console.log('🔑 [RoleManagement] Token preview:', session.access_token.substring(0, 20) + '...');
      
      return headers;
      
    } catch (error) {
      console.error('❌ [RoleManagement] Error getting auth headers:', error);
      
      // Development mode fallback - final catch
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [RoleManagement] Development mode - error fallback, using basic headers');
        return {
          'Content-Type': 'application/json',
          'X-Development-Mode': 'true'
        };
      }
      
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [RoleManagement] Loading roles and permissions data...');
      
      // Get Supabase auth headers with proper error handling
      const headers = await getAuthHeaders();
      
      console.log('🔄 [RoleManagement] Making API calls...');
      
      // Cargar roles
      console.log('📡 [RoleManagement] Fetching roles...');
      const rolesResponse = await fetch('/api/roles', { headers });
      console.log('📡 [RoleManagement] Roles response status:', rolesResponse.status);
      
      if (!rolesResponse.ok) {
        const errorText = await rolesResponse.text();
        console.error('❌ [RoleManagement] Roles API error:', errorText);
        throw new Error(`Roles API error: ${rolesResponse.status} - ${errorText}`);
      }
      
      const rolesData = await rolesResponse.json();
      console.log('✅ [RoleManagement] Roles data received:', rolesData);
      
      // Cargar permisos
      console.log('📡 [RoleManagement] Fetching permissions...');
      const permissionsResponse = await fetch('/api/permissions', { headers });
      console.log('📡 [RoleManagement] Permissions response status:', permissionsResponse.status);
      
      if (!permissionsResponse.ok) {
        const errorText = await permissionsResponse.text();
        console.error('❌ [RoleManagement] Permissions API error:', errorText);
        throw new Error(`Permissions API error: ${permissionsResponse.status} - ${errorText}`);
      }
      
      const permissionsData = await permissionsResponse.json();
      console.log('✅ [RoleManagement] Permissions data received:', permissionsData);
      
      if (rolesData.roles) {
        setRoles(rolesData.roles);
        
        // Cargar permisos para cada rol
        console.log('📡 [RoleManagement] Fetching role permissions...');
        const rolePermsData: RolePermissions = {};
        for (const role of rolesData.roles) {
          console.log(`📡 [RoleManagement] Fetching permissions for role: ${role.name}`);
          const rolePermsResponse = await fetch(`/api/roles/${role.id}/permissions`, { headers });
          
          if (!rolePermsResponse.ok) {
            const errorText = await rolePermsResponse.text();
            console.error(`❌ [RoleManagement] Role ${role.name} permissions API error:`, errorText);
            throw new Error(`Role permissions API error: ${rolePermsResponse.status} - ${errorText}`);
          }
          
          const rolePermsResult = await rolePermsResponse.json();
          rolePermsData[role.id] = rolePermsResult.permissions || [];
          console.log(`✅ [RoleManagement] Role ${role.name} permissions loaded:`, rolePermsResult.permissions?.length || 0);
        }
        setRolePermissions(rolePermsData);
      }
      
      if (permissionsData.permissions) {
        setPermissions(permissionsData.permissions);
      }
      
      console.log('✅ [RoleManagement] All data loaded successfully');
      
    } catch (error) {
      console.error('❌ [RoleManagement] Error loading data:', error);
      toast({
        title: "Error de Autenticación",
        description: `Error al cargar datos: ${error.message}`,
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
      
      console.log(`🔄 [RoleManagement] Saving permissions for role ${roleId}:`, permissionIds);
      
      // Get Supabase auth headers with proper error handling
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissionIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [RoleManagement] Save permissions API error:', errorText);
        throw new Error(`Save permissions API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [RoleManagement] Permissions saved successfully:', result);
      
      toast({
        title: "Éxito",
        description: "Permisos actualizados correctamente",
      });
      
    } catch (error) {
      console.error('❌ [RoleManagement] Error saving permissions:', error);
      toast({
        title: "Error",
        description: `Error al guardar permisos: ${error.message}`,
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