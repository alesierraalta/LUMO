'use client';

import { useState, useEffect } from 'react';
import { Shield, Settings, Users, Package, BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Array<{
    permission: Permission;
  }>;
}

interface PagePermission {
  key: string;
  name: string;
  icon: any;
  description: string;
  permissionName: string;
}

const pagePermissions: PagePermission[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    icon: BarChart3,
    description: 'Access to main dashboard with analytics',
    permissionName: 'page:dashboard'
  },
  {
    key: 'inventory',
    name: 'Inventory',
    icon: Package,
    description: 'Access to inventory management',
    permissionName: 'page:inventory'
  },
  {
    key: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'Access to user settings and preferences',
    permissionName: 'page:settings'
  },
  {
    key: 'userManagement',
    name: 'User Management',
    icon: Users,
    description: 'Access to user administration (admin only)',
    permissionName: 'page:user-management'
  }
];

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles?includePermissions=true');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        setError('Failed to load roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setError('Error loading roles');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (role: Role, permissionName: string): boolean => {
    return role.permissions.some(rp => rp.permission.name === permissionName);
  };

  const togglePermission = async (roleId: string, permissionName: string, hasAccess: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/roles/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId,
          permissionName,
          action: hasAccess ? 'remove' : 'add'
        }),
      });

      if (response.ok) {
        toast.success(`Permission ${hasAccess ? 'removed' : 'granted'} successfully`);
        loadRoles(); // Reload to get updated data
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Error updating permission');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
          <p className="text-muted-foreground">
            Manage what pages each role can access
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="capitalize">{role.name}</span>
              </CardTitle>
              <CardDescription>
                {role.description || `Configure page access for ${role.name} role`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {pagePermissions.map((pagePermission) => {
                  const hasAccess = hasPermission(role, pagePermission.permissionName);
                  const IconComponent = pagePermission.icon;
                  
                  return (
                    <div
                      key={pagePermission.key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${hasAccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            {pagePermission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {pagePermission.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasAccess ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <Switch
                          checked={hasAccess}
                          onCheckedChange={() => togglePermission(role.id, pagePermission.permissionName, hasAccess)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {role.name === 'admin' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Admin role automatically has access to all features including User Management.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 