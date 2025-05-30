'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Eye, EyeOff, Settings, Users, Package, BarChart3, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
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
    description: 'Access to main dashboard with analytics and overview',
    permissionName: 'page:dashboard'
  },
  {
    key: 'inventory',
    name: 'Inventory Management',
    icon: Package,
    description: 'Access to inventory, products, categories, and stock control',
    permissionName: 'page:inventory'
  },
  {
    key: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'Access to user settings, preferences, and profile management',
    permissionName: 'page:settings'
  },
  {
    key: 'userManagement',
    name: 'User Management',
    icon: Users,
    description: 'Administrative access to manage users, roles, and permissions',
    permissionName: 'page:user-management'
  }
];

interface CustomPermissions {
  [key: string]: boolean;
}

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roleId: '',
  });

  // Custom permissions state
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<CustomPermissions>({
    dashboard: true,
    inventory: false,
    settings: true,
    userManagement: false,
  });

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || []);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    loadRoles();
  }, []);

  // Update permissions when role changes
  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, roleId }));
    
    const selectedRole = roles.find(role => role.id === roleId);
    if (selectedRole && !useCustomPermissions) {
      // Set default permissions based on role
      const newPermissions = { ...customPermissions };
      
      switch (selectedRole.name.toLowerCase()) {
        case 'admin':
          newPermissions.dashboard = true;
          newPermissions.inventory = true;
          newPermissions.settings = true;
          newPermissions.userManagement = true;
          break;
        case 'user':
          newPermissions.dashboard = true;
          newPermissions.inventory = true;
          newPermissions.settings = true;
          newPermissions.userManagement = false;
          break;
        case 'viewer':
        case 'operator':
          newPermissions.dashboard = true;
          newPermissions.inventory = false;
          newPermissions.settings = true;
          newPermissions.userManagement = false;
          break;
        default:
          newPermissions.dashboard = true;
          newPermissions.inventory = false;
          newPermissions.settings = true;
          newPermissions.userManagement = false;
      }
      
      setCustomPermissions(newPermissions);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.roleId) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        customPermissions: useCustomPermissions ? customPermissions : undefined,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('User created successfully!');
        router.push('/settings/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('An error occurred while creating the user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div className="flex items-center space-x-2">
          <UserPlus className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
            <p className="text-muted-foreground">
              Create a new user account with custom permissions and access control
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>
                Basic information for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <div>
                            <span className="capitalize font-medium">{role.name}</span>
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password (min 6 chars)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Access Permissions</span>
              </CardTitle>
              <CardDescription>
                Configure exactly what pages and features this user can access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-accent">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Custom Permissions Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Override role defaults with custom access controls
                  </p>
                </div>
                <Switch
                  checked={useCustomPermissions}
                  onCheckedChange={setUseCustomPermissions}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Page Access Control</h4>
                {pagePermissions.map((permission) => {
                  const IconComponent = permission.icon;
                  const hasAccess = customPermissions[permission.key];
                  
                  return (
                    <div
                      key={permission.key}
                      className={`p-4 border rounded-lg transition-all ${
                        !useCustomPermissions ? 'opacity-60 bg-muted/30' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg transition-colors ${
                            hasAccess 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium cursor-pointer">
                              {permission.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
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
                            onCheckedChange={() => handlePermissionToggle(permission.key)}
                            disabled={!useCustomPermissions}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!useCustomPermissions && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Role-based Access:</strong> User will inherit permissions from the selected role. 
                    Enable "Custom Permissions Mode" to override role defaults with specific access controls.
                  </p>
                </div>
              )}

              {useCustomPermissions && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Custom Mode Active:</strong> This user will have the exact permissions configured above, 
                    regardless of their assigned role.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/settings/users')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
} 