'use client';

import { User } from '@/lib/auth-client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Definición de permisos
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: { id: 'dashboard:view', name: 'Ver Dashboard', description: 'Acceso al panel principal', resource: 'dashboard', action: 'view' },
  
  // Inventario
  INVENTORY_VIEW: { id: 'inventory:view', name: 'Ver Inventario', description: 'Ver productos en inventario', resource: 'inventory', action: 'view' },
  INVENTORY_CREATE: { id: 'inventory:create', name: 'Crear Inventario', description: 'Añadir nuevos productos', resource: 'inventory', action: 'create' },
  INVENTORY_EDIT: { id: 'inventory:edit', name: 'Editar Inventario', description: 'Modificar productos existentes', resource: 'inventory', action: 'edit' },
  INVENTORY_DELETE: { id: 'inventory:delete', name: 'Eliminar Inventario', description: 'Eliminar productos del inventario', resource: 'inventory', action: 'delete' },
  
  // Ventas
  SALES_VIEW: { id: 'sales:view', name: 'Ver Ventas', description: 'Ver historial de ventas', resource: 'sales', action: 'view' },
  SALES_CREATE: { id: 'sales:create', name: 'Crear Ventas', description: 'Registrar nuevas ventas', resource: 'sales', action: 'create' },
  SALES_EDIT: { id: 'sales:edit', name: 'Editar Ventas', description: 'Modificar ventas existentes', resource: 'sales', action: 'edit' },
  SALES_DELETE: { id: 'sales:delete', name: 'Eliminar Ventas', description: 'Eliminar registros de ventas', resource: 'sales', action: 'delete' },
  
  // Ubicaciones
  LOCATIONS_VIEW: { id: 'locations:view', name: 'Ver Ubicaciones', description: 'Ver ubicaciones de inventario', resource: 'locations', action: 'view' },
  LOCATIONS_CREATE: { id: 'locations:create', name: 'Crear Ubicaciones', description: 'Añadir nuevas ubicaciones', resource: 'locations', action: 'create' },
  LOCATIONS_EDIT: { id: 'locations:edit', name: 'Editar Ubicaciones', description: 'Modificar ubicaciones existentes', resource: 'locations', action: 'edit' },
  LOCATIONS_DELETE: { id: 'locations:delete', name: 'Eliminar Ubicaciones', description: 'Eliminar ubicaciones', resource: 'locations', action: 'delete' },
  
  // Categorías
  CATEGORIES_VIEW: { id: 'categories:view', name: 'Ver Categorías', description: 'Ver categorías de productos', resource: 'categories', action: 'view' },
  CATEGORIES_CREATE: { id: 'categories:create', name: 'Crear Categorías', description: 'Añadir nuevas categorías', resource: 'categories', action: 'create' },
  CATEGORIES_EDIT: { id: 'categories:edit', name: 'Editar Categorías', description: 'Modificar categorías existentes', resource: 'categories', action: 'edit' },
  CATEGORIES_DELETE: { id: 'categories:delete', name: 'Eliminar Categorías', description: 'Eliminar categorías', resource: 'categories', action: 'delete' },
  
  // Usuarios
  USERS_VIEW: { id: 'users:view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', resource: 'users', action: 'view' },
  USERS_CREATE: { id: 'users:create', name: 'Crear Usuarios', description: 'Añadir nuevos usuarios', resource: 'users', action: 'create' },
  USERS_EDIT: { id: 'users:edit', name: 'Editar Usuarios', description: 'Modificar usuarios existentes', resource: 'users', action: 'edit' },
  USERS_DELETE: { id: 'users:delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema', resource: 'users', action: 'delete' },
  
  // Permisos
  PERMISSIONS_VIEW: { id: 'permissions:view', name: 'Ver Permisos', description: 'Ver configuración de permisos', resource: 'permissions', action: 'view' },
  PERMISSIONS_EDIT: { id: 'permissions:edit', name: 'Editar Permisos', description: 'Modificar permisos de roles', resource: 'permissions', action: 'edit' },
  
  // Configuración
  SETTINGS_VIEW: { id: 'settings:view', name: 'Ver Configuración', description: 'Acceso a configuración del sistema', resource: 'settings', action: 'view' },
  
  // Reportes
  REPORTS_VIEW: { id: 'reports:view', name: 'Ver Reportes', description: 'Acceso a reportes y análisis', resource: 'reports', action: 'view' },
} as const;

// Roles predefinidos con permisos
export const DEFAULT_ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'ADMIN',
    description: 'Acceso completo al sistema',
    permissions: Object.values(PERMISSIONS) as Permission[],
  },
  MANAGER: {
    id: 'manager',
    name: 'MANAGER',
    description: 'Gestión operativa',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_CREATE,
      PERMISSIONS.INVENTORY_EDIT,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.SALES_EDIT,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.LOCATIONS_CREATE,
      PERMISSIONS.LOCATIONS_EDIT,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_CREATE,
      PERMISSIONS.CATEGORIES_EDIT,
      PERMISSIONS.REPORTS_VIEW,
    ] as Permission[],
  },
  USER: {
    id: 'user',
    name: 'USER',
    description: 'Usuario básico',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.CATEGORIES_VIEW,
    ] as Permission[],
  },
};

// Obtener permisos de localStorage
const getStoredPermissions = (): Record<string, string[]> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem('rolePermissions');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Obtener permisos para un rol específico
export const getRolePermissions = (role: string): Permission[] => {
  // Los administradores siempre tienen todos los permisos
  if (role === 'ADMIN') {
    return Object.values(PERMISSIONS);
  }

  // Obtener permisos personalizados del localStorage
  const storedPermissions = getStoredPermissions();
  const rolePermissions = storedPermissions[role];

  if (rolePermissions && Array.isArray(rolePermissions)) {
    return rolePermissions.map(permId => 
      Object.values(PERMISSIONS).find(p => p.id === permId)
    ).filter(Boolean) as Permission[];
  }

  // Fallback a permisos predefinidos
  const defaultRole = DEFAULT_ROLES[role as keyof typeof DEFAULT_ROLES];
  return defaultRole ? defaultRole.permissions : [];
};

// Verificar si el usuario tiene un permiso específico
export const hasPermission = (user: User | null, permissionId: string): boolean => {
  if (!user || !user.isActive) return false;
  
  // Los administradores siempre tienen todos los permisos
  if (user.role === 'ADMIN') return true;

  const userPermissions = getRolePermissions(user.role);
  return userPermissions.some(p => p.id === permissionId);
};

// Verificar múltiples permisos (AND - todos deben ser verdaderos)
export const hasAllPermissions = (user: User | null, permissionIds: string[]): boolean => {
  return permissionIds.every(permId => hasPermission(user, permId));
};

// Verificar múltiples permisos (OR - al menos uno debe ser verdadero)
export const hasAnyPermission = (user: User | null, permissionIds: string[]): boolean => {
  return permissionIds.some(permId => hasPermission(user, permId));
};

// Verificar acceso a un recurso
export const canAccessResource = (user: User | null, resource: string, action: string = 'view'): boolean => {
  const permissionId = `${resource}:${action}`;
  return hasPermission(user, permissionId);
}; 