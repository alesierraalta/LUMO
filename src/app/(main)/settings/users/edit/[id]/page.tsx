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
import Link from "next/link";
import { ArrowLeft, Trash2, Save, Shield, AlertTriangle, Users, Package, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
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

interface CustomPermission {
  permission: {
    id: string;
    name: string;
    resource: string;
    action: string;
  };
  granted: boolean;
}

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
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    roleId: '',
    isActive: true,
  });

  // Custom permissions state
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<CustomPermissions>({
    dashboard: true,
    inventory: false,
    settings: true,
    userManagement: false,
  });

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
          throw new Error('Failed to load user');
        }
        const userData = await userResponse.json();
        
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
          firstName: userData.user.firstName || '',
          lastName: userData.user.lastName || '',
          roleId: userData.user.roleId,
          isActive: userData.user.isActive,
        });

        // Load user's custom permissions if they exist
        if (userData.user.customPermissions && userData.user.customPermissions.length > 0) {
          setUseCustomPermissions(true);
          
          const permissionMap: Record<string, string> = {
            dashboard: 'page:dashboard',
            inventory: 'page:inventory',
            settings: 'page:settings',
            userManagement: 'page:user-management',
          };
          
          // Create reverse mapping from permission name to key
          const reverseMap: Record<string, string> = {};
          Object.entries(permissionMap).forEach(([key, value]) => {
            reverseMap[value] = key;
          });
          
          // Set permissions based on user's custom permissions
          const newPermissions = { ...customPermissions };
          
          userData.user.customPermissions.forEach((cp: CustomPermission) => {
            const permKey = reverseMap[cp.permission.name];
            if (permKey) {
              newPermissions[permKey] = cp.granted;
            }
          });
          
          setCustomPermissions(newPermissions);
        } else {
          // Fall back to role-based permissions
        setDefaultPermissions(userData.user.role.name);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const setDefaultPermissions = (roleName: string) => {
    const newPermissions = { ...customPermissions };
    
    switch (roleName.toLowerCase()) {
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
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, roleId }));
    
    const selectedRole = roles.find(role => role.id === roleId);
    if (selectedRole && !useCustomPermissions) {
      setDefaultPermissions(selectedRole.name);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        customPermissions: useCustomPermissions ? customPermissions : undefined,
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('User updated successfully!');
        router.push('/settings/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        router.push('/settings/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/settings/users">
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/settings/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">Manage user account, role, and permissions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Edit user details and account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email address cannot be changed
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Account Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive users cannot log in
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                Assign role and configure custom permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Selection */}
              <div>
                <Label htmlFor="role">User Role</Label>
                <Select value={formData.roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium capitalize">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Custom Permissions Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useCustom">Custom Permissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Override role permissions with custom settings
                  </p>
                </div>
                <Switch
                  id="useCustom"
                  checked={useCustomPermissions}
                  onCheckedChange={setUseCustomPermissions}
                />
              </div>

              {/* Permissions List */}
              <div className="space-y-4">
                <h4 className="font-medium">Page Access Permissions</h4>
                <div className="space-y-3">
                  {pagePermissions.map((permission) => {
                    const Icon = permission.icon;
                    const isEnabled = customPermissions[permission.key];
                    
                    return (
                      <div key={permission.key} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {permission.description}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handlePermissionToggle(permission.key)}
                          disabled={!useCustomPermissions}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {!useCustomPermissions && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Role-based Access:</strong> User will inherit permissions from the selected role.
                    Enable "Custom Permissions" to override role settings.
                  </AlertDescription>
                </Alert>
              )}

              {useCustomPermissions && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Custom Mode Active:</strong> This user will have the exact permissions configured above,
                    regardless of their role. Role changes will not affect these permissions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* User Status */}
          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Verified</span>
                <Badge variant={user.isEmailVerified ? "default" : "destructive"}>
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">Current Role</span>
                <p className="text-sm text-muted-foreground capitalize">{user.role.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium">Created</span>
                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Last Updated</span>
                <p className="text-sm text-muted-foreground">{formatDate(user.updatedAt)}</p>
              </div>
              {user.lastLoginAt && (
                <div>
                  <span className="text-sm font-medium">Last Login</span>
                  <p className="text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user account? This action cannot be undone.
              <br /><br />
              <strong>User:</strong> {user.email}
              <br />
              <strong>Name:</strong> {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 