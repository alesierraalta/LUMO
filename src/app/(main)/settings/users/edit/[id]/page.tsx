'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, Trash2, Save, Shield, AlertTriangle, Users, Package, BarChart3, Settings, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

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
  isSystem: boolean;
  isActive: boolean;
  permissions?: string | Permission[];
}

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    isActive: boolean;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  customPermissions?: Permission[];
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

// Agrupar permisos por categoría
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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditUserPage({ params }: PageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('basic');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    roleId: '',
    isActive: true,
  });

  // Custom permissions state
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const [userId, setUserId] = useState<string>('');

  // Get user ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Load user data and roles
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load user
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          if (userResponse.status === 404) {
            setError('User not found');
            return;
          }
          throw new Error('Failed to load user');
        }
        const userData = await userResponse.json();
        
        if (!userData.success || !userData.user) {
          setError('User not found');
          return;
        }
        
        // Load roles
        const rolesResponse = await fetch('/api/roles');
        if (!rolesResponse.ok) {
          throw new Error('Failed to load roles');
        }
        const rolesData = await rolesResponse.json();
        
        setUser(userData.user);
        setRoles(rolesData.roles || []);
        
        // Set form data
        setFormData({
          name: userData.user.name || '',
          firstName: userData.user.firstName || '',
          lastName: userData.user.lastName || '',
          roleId: userData.user.roleId,
          isActive: userData.user.isActive,
        });

        // Load user's custom permissions if they exist
        if (userData.user.customPermissions && userData.user.customPermissions.length > 0) {
          setUseCustomPermissions(true);
          const userPermissionNames = userData.user.customPermissions.map((p: Permission) => p.name);
          setCustomPermissions(userPermissionNames);
        } else {
          // Set default permissions based on role
          const selectedRole = rolesData.roles.find((role: Role) => role.id === userData.user.roleId);
          if (selectedRole) {
            setDefaultPermissionsFromRole(selectedRole);
          }
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load user data');
        toast.error('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

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

  const getSelectedRole = (): Role | undefined => {
    return roles.find(role => role.id === formData.roleId);
  };

  const getRolePermissions = (role: Role): Permission[] => {
    if (!role.permissions) return [];
    return parsePermissions(role.permissions);
  };

  const setDefaultPermissionsFromRole = (role: Role) => {
    const rolePermissions = getRolePermissions(role);
    const permissionNames = rolePermissions.map(p => p.name);
    setCustomPermissions(permissionNames);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, roleId }));
    
    // If not using custom permissions, update permissions based on role
    if (!useCustomPermissions) {
      const selectedRole = roles.find(role => role.id === roleId);
      if (selectedRole) {
        setDefaultPermissionsFromRole(selectedRole);
      }
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    setCustomPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  };

  const selectAllPermissionsInCategory = (category: string) => {
    const categoryPermissions = permissionGroups[category].map(p => p.name);
    const allSelected = categoryPermissions.every(p => customPermissions.includes(p));
    
    if (allSelected) {
      // Deselect all in category
      setCustomPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      // Select all in category
      setCustomPermissions(prev => {
        const newPermissions = [...prev];
        categoryPermissions.forEach(p => {
          if (!newPermissions.includes(p)) {
            newPermissions.push(p);
          }
        });
        return newPermissions;
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updateData: any = {
        name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        isActive: formData.isActive,
      };

      // Include custom permissions if enabled
      if (useCustomPermissions) {
        updateData.customPermissions = customPermissions;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('Usuario actualizado exitosamente');
      router.push('/settings/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast.success('Usuario eliminado exitosamente');
      router.push('/settings/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Usuario no encontrado'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedRole = getSelectedRole();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Usuario</h1>
            <p className="text-muted-foreground">
              Modifica la información y permisos del usuario
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSaving || isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
          <CardDescription>
            Usuario creado el {formatDate(new Date(user.createdAt))}
            {user.lastLoginAt && ` • Último acceso: ${formatDate(new Date(user.lastLoginAt))}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Rol Actual</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getRoleTypeColor(user.role.isSystem)}>
                  {user.role.name}
                </Badge>
                {user.role.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    Sistema
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email Verificado</Label>
              <Badge variant={user.isEmailVerified ? "default" : "destructive"}>
                {user.isEmailVerified ? "Verificado" : "No Verificado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="permissions">Permisos y Acceso</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza la información básica del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Apellido del usuario"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nombre completo del usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span>{role.name}</span>
                          <Badge variant="outline" className={getRoleTypeColor(role.isSystem)}>
                            {role.isSystem ? 'Sistema' : 'Personalizado'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRole.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked.toString())}
                />
                <Label htmlFor="isActive">Usuario activo</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Permisos
              </CardTitle>
              <CardDescription>
                Define los permisos específicos para este usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Permissions Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Permisos Personalizados</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita para configurar permisos específicos en lugar de usar los del rol
                  </p>
                </div>
                <Switch
                  checked={useCustomPermissions}
                  onCheckedChange={setUseCustomPermissions}
                />
              </div>

              {/* Role Permissions Preview */}
              {!useCustomPermissions && selectedRole && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-medium">
                      Permisos del Rol: {selectedRole.name}
                    </Label>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Este usuario heredará automáticamente los permisos configurados para el rol "{selectedRole.name}".
                    </p>
                    {getRolePermissions(selectedRole).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getRolePermissions(selectedRole).map((permission) => (
                          <Badge
                            key={permission.name}
                            variant="outline"
                            className={getCategoryColor(permission.category)}
                          >
                            {permission.description}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay permisos específicos configurados para este rol.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Permissions Configuration */}
              {useCustomPermissions && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-medium">Permisos Específicos</Label>
                  </div>

                  {Object.entries(permissionGroups).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getCategoryColor(category)}>
                            {category === 'page' && 'Páginas'}
                            {category === 'feature' && 'Funcionalidades'}
                            {category === 'admin' && 'Administración'}
                            {category === 'data' && 'Datos'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {permissions.filter(p => customPermissions.includes(p.name)).length} de {permissions.length} seleccionados
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllPermissionsInCategory(category)}
                        >
                          {permissions.every(p => customPermissions.includes(p.name)) ? (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Deseleccionar Todo
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Seleccionar Todo
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {permissions.map((permission) => (
                          <div
                            key={permission.name}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              customPermissions.includes(permission.name)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handlePermissionToggle(permission.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    customPermissions.includes(permission.name)
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-muted-foreground'
                                  }`}>
                                    {customPermissions.includes(permission.name) && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {permission.description}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission.resource}.{permission.action}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Permissions Summary */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4" />
                      <Label className="text-sm font-medium">Resumen de Permisos</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total de permisos seleccionados: <strong>{customPermissions.length}</strong> de {availablePermissions.length} disponibles
                    </p>
                    {customPermissions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {customPermissions.slice(0, 10).map((permissionName) => {
                          const permission = availablePermissions.find(p => p.name === permissionName);
                          return permission ? (
                            <Badge
                              key={permissionName}
                              variant="outline"
                              className={`text-xs ${getCategoryColor(permission.category)}`}
                            >
                              {permission.description}
                            </Badge>
                          ) : null;
                        })}
                        {customPermissions.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{customPermissions.length - 10} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Usuario?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El usuario "{user.name || user.email}" será eliminado permanentemente del sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 