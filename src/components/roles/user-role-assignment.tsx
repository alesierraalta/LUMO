'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Search, Shield, Users, Settings } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface UserRoleAssignmentProps {
  userId?: string;
  onUserIdChange?: (userId: string) => void;
}

const UserRoleAssignment = ({ userId: initialUserId, onUserIdChange }: UserRoleAssignmentProps) => {
  const [userId, setUserId] = useState(initialUserId || '');
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const { toast } = useToast();

  // Enhanced helper function to get auth headers with development mode fallback
  const getAuthHeaders = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase-singleton');
      const supabase = getSupabaseClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Development mode fallback
        if (process.env.NODE_ENV === 'development') {
          return {
            'Content-Type': 'application/json',
            'X-Development-Mode': 'true'
          };
        }
        throw new Error('Authentication required');
      }
      
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      };
    } catch (error) {
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        return {
          'Content-Type': 'application/json',
          'X-Development-Mode': 'true'
        };
      }
      throw error;
    }
  };

  // Load available roles
  useEffect(() => {
    loadRoles();
  }, []);

  // Load user roles when userId changes
  useEffect(() => {
    if (userId) {
      loadUserRoles();
    }
  }, [userId]);

  const loadRoles = async () => {
    try {
      console.log('🔄 [UserRoleAssignment] Loading available roles...');
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/roles', { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to load roles: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.roles) {
        setRoles(data.roles);
        console.log('✅ [UserRoleAssignment] Loaded roles:', data.roles.length);
      }
    } catch (error) {
      console.error('❌ [UserRoleAssignment] Error loading roles:', error);
      toast({
        title: "Error",
        description: `Error al cargar roles: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const loadUserRoles = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log('🔄 [UserRoleAssignment] Loading user roles for:', userId);
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/users/${userId}/roles`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to load user roles: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.roles) {
        setUserRoles(data.roles);
        console.log('✅ [UserRoleAssignment] Loaded user roles:', data.roles.length);
      }
    } catch (error) {
      console.error('❌ [UserRoleAssignment] Error loading user roles:', error);
      toast({
        title: "Error",
        description: `Error al cargar roles del usuario: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setUserRoles(prev => {
      if (checked) {
        const role = roles.find(r => r.id === roleId);
        if (role && !prev.find(r => r.id === roleId)) {
          return [...prev, role];
        }
      } else {
        return prev.filter(r => r.id !== roleId);
      }
      return prev;
    });
  };

  const saveUserRoles = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Por favor especifica un ID de usuario",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      console.log('🔄 [UserRoleAssignment] Saving user roles for:', userId);
      
      const roleIds = userRoles.map(r => r.id);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ roleIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save user roles: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [UserRoleAssignment] User roles saved:', result);
      
      toast({
        title: "Éxito",
        description: `Roles actualizados correctamente para el usuario ${userId}`,
      });
      
    } catch (error) {
      console.error('❌ [UserRoleAssignment] Error saving user roles:', error);
      toast({
        title: "Error",
        description: `Error al guardar roles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSearchUser = () => {
    if (searchUserId.trim()) {
      setUserId(searchUserId.trim());
      onUserIdChange?.(searchUserId.trim());
    }
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

  const getRoleBadgeVariant = (roleName: string): "default" | "destructive" | "secondary" | "outline" => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Asignación de Roles a Usuario
          </CardTitle>
          <CardDescription>
            Asigna roles específicos a un usuario del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User ID Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="user-search">ID del Usuario</Label>
              <Input
                id="user-search"
                placeholder="Ingresa el ID del usuario"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <Button 
              onClick={handleSearchUser} 
              disabled={!searchUserId.trim()}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>

          {/* Current User Info */}
          {userId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Usuario actual: {userId}</p>
              <p className="text-xs text-muted-foreground">
                Roles asignados: {userRoles.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Assignment */}
      {userId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles Disponibles
              </CardTitle>
              <CardDescription>
                Selecciona los roles que tendrá este usuario
              </CardDescription>
            </div>
            <Button
              onClick={saveUserRoles}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Roles
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando roles...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => {
                  const isAssigned = userRoles.some(ur => ur.id === role.id);
                  return (
                    <div key={role.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={isAssigned}
                        onCheckedChange={(checked) => 
                          handleRoleChange(role.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`role-${role.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.name)}
                          <span className="font-medium">{role.name}</span>
                          <Badge variant={getRoleBadgeVariant(role.name)}>
                            {role.name}
                          </Badge>
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserRoleAssignment;