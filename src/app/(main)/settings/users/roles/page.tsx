'use client';

import { useState, useEffect } from 'react';
import { Shield, Loader2, Plus, Trash2, Edit, Eye, EyeOff, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  permissions: string | Permission[]; // Can be JSON string or parsed array
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Definición de permisos disponibles organizados por categoría
const availablePermissions: Omit<Permission, 'id'>[] = [
  // Dashboard
  { name: 'dashboard.view', description: 'Ver dashboard', resource: 'dashboard', action: 'view', category: 'page' },
  
  // Inventario
  { name: 'inventory.view', description: 'Ver inventario', resource: 'inventory', action: 'view', category: 'page' },
  { name: 'inventory.create', description: 'Crear productos', resource: 'inventory', action: 'create', category: 'feature' },
  { name: 'inventory.edit', description: 'Editar productos', resource: 'inventory', action: 'edit', category: 'feature' },
  { name: 'inventory.delete', description: 'Eliminar productos', resource: 'inventory', action: 'delete', category: 'feature' },
  { name: 'inventory.import', description: 'Importar inventario', resource: 'inventory', action: 'import', category: 'feature' },
  { name: 'inventory.export', description: 'Exportar inventario', resource: 'inventory', action: 'export', category: 'feature' },
  
  // Ventas
  { name: 'sales.view', description: 'Ver ventas', resource: 'sales', action: 'view', category: 'page' },
  { name: 'sales.create', description: 'Crear ventas', resource: 'sales', action: 'create', category: 'feature' },
  { name: 'sales.edit', description: 'Editar ventas', resource: 'sales', action: 'edit', category: 'feature' },
  { name: 'sales.refund', description: 'Procesar reembolsos', resource: 'sales', action: 'refund', category: 'feature' },
  
  // Ubicaciones
  { name: 'locations.view', description: 'Ver ubicaciones', resource: 'locations', action: 'view', category: 'page' },
  { name: 'locations.create', description: 'Crear ubicaciones', resource: 'locations', action: 'create', category: 'feature' },
  { name: 'locations.edit', description: 'Editar ubicaciones', resource: 'locations', action: 'edit', category: 'feature' },
  { name: 'locations.delete', description: 'Eliminar ubicaciones', resource: 'locations', action: 'delete', category: 'feature' },
  
  // Categorías
  { name: 'categories.view', description: 'Ver categorías', resource: 'categories', action: 'view', category: 'page' },
  { name: 'categories.create', description: 'Crear categorías', resource: 'categories', action: 'create', category: 'feature' },
  { name: 'categories.edit', description: 'Editar categorías', resource: 'categories', action: 'edit', category: 'feature' },
  { name: 'categories.delete', description: 'Eliminar categorías', resource: 'categories', action: 'delete', category: 'feature' },
  
  // Usuarios (solo admin)
  { name: 'users.view', description: 'Ver usuarios', resource: 'users', action: 'view', category: 'admin' },
  { name: 'users.create', description: 'Crear usuarios', resource: 'users', action: 'create', category: 'admin' },
  { name: 'users.edit', description: 'Editar usuarios', resource: 'users', action: 'edit', category: 'admin' },
  { name: 'users.delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete', category: 'admin' },
  
  // Roles y Permisos (solo admin)
  { name: 'roles.view', description: 'Ver roles', resource: 'roles', action: 'view', category: 'admin' },
  { name: 'roles.create', description: 'Crear roles', resource: 'roles', action: 'create', category: 'admin' },
  { name: 'roles.edit', description: 'Editar roles', resource: 'roles', action: 'edit', category: 'admin' },
  { name: 'roles.delete', description: 'Eliminar roles', resource: 'roles', action: 'delete', category: 'admin' },
  { name: 'permissions.view', description: 'Ver permisos', resource: 'permissions', action: 'view', category: 'admin' },
  { name: 'permissions.manage', description: 'Gestionar permisos', resource: 'permissions', action: 'manage', category: 'admin' },
  
  // Configuración
  { name: 'settings.view', description: 'Ver configuración', resource: 'settings', action: 'view', category: 'page' },
  { name: 'settings.edit', description: 'Editar configuración', resource: 'settings', action: 'edit', category: 'feature' },
  
  // Reportes
  { name: 'reports.view', description: 'Ver reportes', resource: 'reports', action: 'view', category: 'page' },
  { name: 'reports.export', description: 'Exportar reportes', resource: 'reports', action: 'export', category: 'feature' },
  { name: 'reports.schedule', description: 'Programar reportes', resource: 'reports', action: 'schedule', category: 'feature' }
];

// Agrupar permisos por categoría para mejor organización
const groupPermissionsByCategory = () => {
  const groups: { [key: string]: typeof availablePermissions } = {};
  availablePermissions.forEach(permission => {
    if (!groups[permission.category]) {
      groups[permission.category] = [];
    }
    groups[permission.category].push(permission);
  });
  return groups;
};

const permissionGroups = groupPermissionsByCategory();

// Obtener color para categoría de permisos
const getCategoryColor = (category: string) => {
  const colors = {
    page: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    feature: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    admin: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    data: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
};

// Obtener color para tipo de rol
const getRoleTypeColor = (isSystem: boolean) => {
  return isSystem 
    ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
};

export default function RolePermissionsPage() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  
  // Estados para crear nuevo rol
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState(1); // 1: Info básica, 2: Permisos

  // Estado para filtros y vista
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a esta sección');
        return;
      }

      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Error fetching roles');
      }

      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
      } else {
        toast.error('Error al cargar los roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Error al cargar los roles');
    } finally {
      setIsLoading(false);
    }
  };

  const parsePermissions = (permissions: string | Permission[]): Permission[] => {
    if (typeof permissions === 'string') {
      try {
        return JSON.parse(permissions);
      } catch {
        return [];
      }
    }
    return permissions || [];
  };

  const hasPermission = (role: Role, permissionName: string): boolean => {
    const permissions = parsePermissions(role.permissions);
    return permissions.some(p => p.name === permissionName);
  };

  const togglePermission = async (roleId: string, permissionName: string) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) {
        toast.error('Rol no encontrado');
        return;
      }

      if (role.isSystem) {
        toast.error('No se pueden modificar los roles del sistema');
        return;
      }

      const currentPermissions = parsePermissions(role.permissions);
      const hasPerms = hasPermission(role, permissionName);
      const permission = availablePermissions.find(p => p.name === permissionName);

      let updatedPermissions: Permission[];

      if (hasPerms) {
        updatedPermissions = currentPermissions.filter(p => p.name !== permissionName);
      } else {
        if (permission) {
          updatedPermissions = [...currentPermissions, { ...permission, id: `perm-${Date.now()}` }];
        } else {
          updatedPermissions = currentPermissions;
        }
      }

      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: updatedPermissions
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error updating role');
      }

      setRoles(prevRoles => 
        prevRoles.map(r => 
          r.id === roleId 
            ? { ...r, permissions: JSON.stringify(updatedPermissions) }
            : r
        )
      );

      toast.success('Permiso actualizado');
    } catch (error: any) {
      console.error('Error toggling permission:', error);
      toast.error(error.message || 'Error al actualizar el permiso');
    } finally {
      setIsSaving(false);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      toast.error('Nombre y descripción son requeridos');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('Debe seleccionar al menos un permiso');
      return;
    }

    setIsSaving(true);

    try {
      // Crear array de permisos basado en las selecciones
      const permissionsToAdd = selectedPermissions.map(permName => {
        const permission = availablePermissions.find(p => p.name === permName);
        return permission ? { ...permission, id: `perm-${Date.now()}-${permName}` } : null;
      }).filter(Boolean);

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
          permissions: permissionsToAdd
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creating role');
      }

      const data = await response.json();
      if (data.success) {
        setRoles(prev => [...prev, data.role]);
        setShowCreateRole(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setSelectedPermissions([]);
        setCreateStep(1);
        toast.success('Rol creado exitosamente');
      }
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Error al crear el rol');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      toast.error('No se pueden eliminar los roles del sistema');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el rol "${role.name}"?`)) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Better error message for role assigned to users
        if (error.error?.includes('assigned to users')) {
          toast.error(`No se puede eliminar "${role.name}" porque está asignado a usuarios. Primero reasigna o elimina los usuarios con este rol.`);
        } else {
          toast.error(error.error || 'Error al eliminar el rol');
        }
        return;
      }

      setRoles(prev => prev.filter(r => r.id !== roleId));
      toast.success('Rol eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error('Error de conexión al eliminar el rol');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionSelect = (permissionName: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const selectAllPermissionsInCategory = (category: string) => {
    const categoryPermissions = permissionGroups[category].map(p => p.name);
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  // Filtrar roles
  const filteredRoles = roles.filter(role => {
    if (!role) return false; // Prevent null/undefined roles
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = roleTypeFilter === 'all' || 
                       (roleTypeFilter === 'system' && role.isSystem) ||
                       (roleTypeFilter === 'custom' && !role.isSystem);
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar roles y permisos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Crea y gestiona roles personalizados con permisos granulares
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateRole(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Rol Personalizado
        </Button>
      </div>

      {/* Filtros y estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{roles.length}</div>
            <div className="text-sm text-muted-foreground">Total Roles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {roles.filter(r => r?.isSystem).length}
            </div>
            <div className="text-sm text-muted-foreground">Roles Sistema</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {roles.filter(r => r && !r.isSystem).length}
            </div>
            <div className="text-sm text-muted-foreground">Roles Personalizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {availablePermissions.length}
            </div>
            <div className="text-sm text-muted-foreground">Permisos Disponibles</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtro */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar roles por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleTypeFilter} onValueChange={setRoleTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="system">Roles del Sistema</SelectItem>
            <SelectItem value="custom">Roles Personalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoles.map((role) => {
          const permissions = parsePermissions(role.permissions);
          const isEditing = editingRole === role.id;
          
          return (
            <Card key={role.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {role.name}
                        <Badge variant="outline" className={getRoleTypeColor(role.isSystem)}>
                          {role.isSystem ? 'Sistema' : 'Personalizado'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(isEditing ? null : role.id)}
                    >
                      {isEditing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Permisos ({permissions.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {permissions.slice(0, 6).map((permission) => (
                        <Badge 
                          key={permission.name}
                          variant="outline" 
                          className={getCategoryColor(permission.category)}
                        >
                          {permission.description}
                        </Badge>
                      ))}
                      {permissions.length > 6 && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          +{permissions.length - 6} más
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isEditing && !role.isSystem && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">Gestionar Permisos</div>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {Object.entries(permissionGroups).map(([category, categoryPermissions]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">
                                {category === 'page' && 'Páginas'}
                                {category === 'feature' && 'Funcionalidades'}
                                {category === 'admin' && 'Administración'}
                                {category === 'data' && 'Datos'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {categoryPermissions.map((permission) => (
                                <div key={permission.name} className="flex items-center space-x-2">
                                  <Switch
                                    checked={hasPermission(role, permission.name)}
                                    onCheckedChange={() => togglePermission(role.id, permission.name)}
                                    disabled={isSaving}
                                  />
                                  <span className="text-sm">{permission.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No se encontraron roles</h3>
          <p className="text-muted-foreground">
            {searchTerm || roleTypeFilter !== 'all'
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Crea tu primer rol personalizado para comenzar'
            }
          </p>
        </div>
      )}

      {/* Dialog para crear nuevo rol */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Crear Rol Personalizado</DialogTitle>
            <DialogDescription>
              Define un nuevo rol con permisos específicos para tus usuarios
            </DialogDescription>
          </DialogHeader>

          <Tabs value={createStep.toString()} onValueChange={(v) => setCreateStep(parseInt(v))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="1">Información Básica</TabsTrigger>
              <TabsTrigger value="2">Permisos</TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre del Rol</label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Ej: Editor de Inventario"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    placeholder="Describe las responsabilidades de este rol..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="2" className="space-y-4">
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {Object.entries(permissionGroups).map(([category, categoryPermissions]) => {
                  const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.name));
                  const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p.name));
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">
                          {category === 'page' && 'Acceso a Páginas'}
                          {category === 'feature' && 'Funcionalidades'}
                          {category === 'admin' && 'Administración'}
                          {category === 'data' && 'Gestión de Datos'}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllPermissionsInCategory(category)}
                        >
                          {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-gray-200">
                        {categoryPermissions.map((permission) => (
                          <div 
                            key={permission.name} 
                            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                              selectedPermissions.includes(permission.name)
                                ? 'bg-blue-50 border-blue-200 border'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handlePermissionSelect(permission.name)}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedPermissions.includes(permission.name)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedPermissions.includes(permission.name) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{permission.description}</div>
                              <div className="text-xs text-gray-500">{permission.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Permisos seleccionados: {selectedPermissions.length} de {availablePermissions.length}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRole(false)}>
              Cancelar
            </Button>
            {createStep === 1 ? (
              <Button 
                onClick={() => setCreateStep(2)}
                disabled={!newRoleName.trim() || !newRoleDescription.trim()}
              >
                Siguiente: Permisos
              </Button>
            ) : (
              <Button 
                onClick={createRole}
                disabled={isSaving || selectedPermissions.length === 0}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear Rol
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 