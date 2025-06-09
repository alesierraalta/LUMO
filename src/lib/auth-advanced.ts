import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: string;
  email: string;
  name: string | null;
  roleId: string | null;
  role?: Role | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  rolePermissions: RolePermission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  category: string;
  isSystem: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface AuthUser extends User {
  permissions: Permission[];
}

// Autenticar usuario con email y contraseña
export const authenticateUser = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Obtener permisos del usuario
    const permissions = user.role?.rolePermissions.map(rp => rp.permission) || [];

    return {
      ...user,
      permissions
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

// Generar token JWT
export const generateToken = (user: AuthUser): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    permissions: user.permissions.map(p => p.name)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Verificar token JWT
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Obtener usuario actual desde token
export const getCurrentUser = async (request: NextRequest): Promise<AuthUser | null> => {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    const permissions = user.role?.rolePermissions.map(rp => rp.permission) || [];

    return {
      ...user,
      permissions
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Verificar si el usuario tiene un permiso específico
export const hasPermission = (user: AuthUser | null, permissionName: string): boolean => {
  if (!user) return false;
  
  // Los administradores siempre tienen todos los permisos
  if (user.role?.name === 'ADMIN') return true;
  
  return user.permissions.some(permission => permission.name === permissionName);
};

// Verificar múltiples permisos (AND - todos requeridos)
export const hasAllPermissions = (user: AuthUser | null, permissionNames: string[]): boolean => {
  if (!user) return false;
  
  // Los administradores siempre tienen todos los permisos
  if (user.role?.name === 'ADMIN') return true;
  
  return permissionNames.every(permissionName => 
    user.permissions.some(permission => permission.name === permissionName)
  );
};

// Verificar múltiples permisos (OR - al menos uno requerido)
export const hasAnyPermission = (user: AuthUser | null, permissionNames: string[]): boolean => {
  if (!user) return false;
  
  // Los administradores siempre tienen todos los permisos
  if (user.role?.name === 'ADMIN') return true;
  
  return permissionNames.some(permissionName => 
    user.permissions.some(permission => permission.name === permissionName)
  );
};

// Verificar acceso a recurso específico
export const hasResourceAccess = (user: AuthUser | null, resource: string, action: string): boolean => {
  if (!user) return false;
  
  // Los administradores siempre tienen todos los permisos
  if (user.role?.name === 'ADMIN') return true;
  
  return user.permissions.some(permission => 
    permission.resource === resource && permission.action === action
  );
};

// Obtener todos los permisos de un usuario
export const getUserPermissions = (user: AuthUser | null): Permission[] => {
  if (!user) return [];
  return user.permissions;
};

// Filtrar datos basado en permisos
export const filterByPermissions = <T>(
  user: AuthUser | null,
  data: T[],
  requiredPermission: string
): T[] => {
  if (!user) return [];
  
  if (hasPermission(user, requiredPermission)) {
    return data;
  }
  
  return [];
};

// Crear usuario con hash de contraseña
export const createUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  roleId?: string;
}): Promise<User | null> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        roleId: userData.roleId
      },
      include: {
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Funciones de utilidad para roles y permisos
export const getRoles = async () => {
  return await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const getPermissions = async () => {
  return await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }]
  });
};

export const assignPermissionToRole = async (roleId: string, permissionId: string) => {
  try {
    return await prisma.rolePermission.create({
      data: { roleId, permissionId }
    });
  } catch (error) {
    // Ignorar errores de duplicados
    return null;
  }
};

export const removePermissionFromRole = async (roleId: string, permissionId: string) => {
  try {
    return await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId }
      }
    });
  } catch (error) {
    return null;
  }
};

// Middlewares de autorización
export const requirePermission = (permissionName: string) => {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return new Response('No autorizado', { status: 401 });
    }
    
    if (!hasPermission(user, permissionName)) {
      return new Response('Sin permisos suficientes', { status: 403 });
    }
    
    return null; // Permitir acceso
  };
};

export const requireAnyPermission = (permissionNames: string[]) => {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return new Response('No autorizado', { status: 401 });
    }
    
    if (!hasAnyPermission(user, permissionNames)) {
      return new Response('Sin permisos suficientes', { status: 403 });
    }
    
    return null; // Permitir acceso
  };
};

export const requireRole = (roleName: string) => {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return new Response('No autorizado', { status: 401 });
    }
    
    if (user.role?.name !== roleName && user.role?.name !== 'ADMIN') {
      return new Response('Sin permisos suficientes', { status: 403 });
    }
    
    return null; // Permitir acceso
  };
}; 