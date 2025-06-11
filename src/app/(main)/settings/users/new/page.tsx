'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, User, Mail, Lock, Shield, Plus, Check, X, Users, Settings } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { toast } from 'sonner';
import Link from 'next/link';

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

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [currentTab, setCurrentTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  // Load available roles
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await fetch('/api/roles');
      
      if (!response.ok) {
        throw new Error('Failed to load roles');
      }
      
      const data = await response.json();
      if (data.success && data.roles) {
        // Filter only active roles
        const activeRoles = data.roles.filter((role: Role) => role.isActive);
        setRoles(activeRoles);
        
        // Set default role to USER if available
        const userRole = activeRoles.find((role: Role) => role.name === 'USER');
        if (userRole) {
          setFormData(prev => ({ ...prev, roleId: userRole.id }));
        }
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Error al cargar los roles');
    } finally {
      setIsLoadingRoles(false);
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

  const getSelectedRole = (): Role | undefined => {
    return roles.find(role => role.id === formData.roleId);
  };

  const getRolePermissions = (role: Role): Permission[] => {
    if (!role.permissions) return [];
    return parsePermissions(role.permissions);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'El rol es requerido';
    }

    if (useCustomPermissions && customPermissions.length === 0) {
      newErrors.customPermissions = 'Debe seleccionar al menos un permiso personalizado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Si hay errores en la primera pestaña, cambiar a ella
      if (errors.name || errors.email || errors.password || errors.confirmPassword || errors.roleId) {
        setCurrentTab('basic');
      } else if (errors.customPermissions) {
        setCurrentTab('permissions');
      }
      return;
    }

    setIsLoading(true);

    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
      };

      // Si se usan permisos personalizados, incluirlos
      if (useCustomPermissions) {
        userData.customPermissions = customPermissions;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Usuario creado exitosamente');
        router.push('/settings/users');
      } else {
        toast.error(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleChange = (roleId: string) => {
    handleInputChange('roleId', roleId);
    
    // Si se selecciona un nuevo rol, limpiar permisos personalizados
    if (!useCustomPermissions) {
      setCustomPermissions([]);
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    setCustomPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
    
    // Limpiar error de permisos personalizados
    if (errors.customPermissions) {
      setErrors(prev => ({ ...prev, customPermissions: '' }));
    }
  };

  const selectAllPermissionsInCategory = (category: string) => {
    const categoryPermissions = permissionGroups[category].map(p => p.name);
    const allSelected = categoryPermissions.every(p => customPermissions.includes(p));
    
    if (allSelected) {
      setCustomPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      setCustomPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  const selectedRole = getSelectedRole();
  const rolePermissions = selectedRole ? getRolePermissions(selectedRole) : [];

  return (
    <PermissionGuard permission="users:create">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Usuario</h1>
              <p className="text-muted-foreground">
                Agrega un nuevo usuario al sistema con roles y permisos específicos
              </p>
            </div>
            <Link href="/settings/users/roles">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gestionar Roles
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
            <CardDescription>
              Completa la información del usuario y configura sus permisos de acceso
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="permissions">Roles y Permisos</TabsTrigger>
                </TabsList>

                {/* Información Básica */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Nombre completo del usuario"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirma la contraseña"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Basic Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol del Usuario</Label>
                    <Select
                      value={formData.roleId}
                      onValueChange={handleRoleChange}
                      disabled={isLoadingRoles}
                    >
                      <SelectTrigger className={errors.roleId ? 'border-red-500' : ''}>
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
                    {errors.roleId && (
                      <p className="text-sm text-red-600">{errors.roleId}</p>
                    )}
                    
                    {selectedRole && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">{selectedRole.description}</p>
                        {rolePermissions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Permisos incluidos ({rolePermissions.length}):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rolePermissions.slice(0, 4).map((permission) => (
                                <Badge 
                                  key={permission.name}
                                  variant="outline" 
                                  className={getCategoryColor(permission.category)}
                                >
                                  {permission.description}
                                </Badge>
                              ))}
                              {rolePermissions.length > 4 && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  +{rolePermissions.length - 4} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Roles y Permisos */}
                <TabsContent value="permissions" className="space-y-6 mt-6">
                  <div className="space-y-6">
                    {/* Toggle para permisos personalizados */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Permisos Personalizados</h3>
                        <p className="text-sm text-muted-foreground">
                          Otorgar permisos específicos además de los del rol seleccionado
                        </p>
                      </div>
                      <Switch
                        checked={useCustomPermissions}
                        onCheckedChange={setUseCustomPermissions}
                      />
                    </div>

                    {/* Mostrar permisos del rol seleccionado */}
                    {selectedRole && (
                      <div className="space-y-3">
                        <h3 className="font-medium">Permisos del Rol: {selectedRole.name}</h3>
                        {rolePermissions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                            {rolePermissions.map((permission) => (
                              <div key={permission.name} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{permission.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Este rol no tiene permisos predefinidos
                          </p>
                        )}
                      </div>
                    )}

                    {/* Permisos personalizados */}
                    {useCustomPermissions && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Permisos Adicionales</h3>
                          <div className="text-sm text-muted-foreground">
                            {customPermissions.length} permisos seleccionados
                          </div>
                        </div>

                        {errors.customPermissions && (
                          <Alert variant="destructive">
                            <AlertDescription>{errors.customPermissions}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-6 max-h-96 overflow-y-auto">
                          {Object.entries(permissionGroups).map(([category, categoryPermissions]) => {
                            const allSelected = categoryPermissions.every(p => customPermissions.includes(p.name));
                            
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
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => selectAllPermissionsInCategory(category)}
                                  >
                                    {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-gray-200">
                                  {categoryPermissions.map((permission) => {
                                    const isSelected = customPermissions.includes(permission.name);
                                    const isFromRole = rolePermissions.some(rp => rp.name === permission.name);
                                    
                                    return (
                                      <div 
                                        key={permission.name} 
                                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                                          isSelected && !isFromRole
                                            ? 'bg-blue-50 border-blue-200 border'
                                            : isFromRole
                                            ? 'bg-green-50 border-green-200 border opacity-75'
                                            : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => !isFromRole && handlePermissionToggle(permission.name)}
                                      >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                          isSelected || isFromRole
                                            ? isFromRole 
                                              ? 'bg-green-600 border-green-600'
                                              : 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300'
                                        }`}>
                                          {(isSelected || isFromRole) && (
                                            <Check className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{permission.description}</div>
                                          <div className="text-xs text-gray-500">
                                            {permission.name}
                                            {isFromRole && (
                                              <span className="ml-2 text-green-600">(incluido en rol)</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Link href="/settings/users">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                
                <div className="flex items-center gap-2">
                  {currentTab === 'permissions' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab('basic')}
                    >
                      Anterior
                    </Button>
                  )}
                  
                  {currentTab === 'basic' ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentTab('permissions')}
                      disabled={!formData.name || !formData.email || !formData.password || !formData.roleId}
                    >
                      Siguiente: Permisos
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />}
                      Crear Usuario
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
} 