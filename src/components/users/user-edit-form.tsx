'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

interface UserEditFormProps {
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getAuthHeaders = () => {
  // Check if running in development mode
  if (process.env.NODE_ENV === 'development') {
    return {
      'Content-Type': 'application/json',
      'X-Development-Mode': 'true'
    };
  }
  
  // In production, include auth headers
  return {
    'Content-Type': 'application/json'
  };
};

export default function UserEditForm({ userId, onSuccess, onCancel }: UserEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    isActive: true
  });

  // Available roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles', {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to load roles');
        }
        
        const data = await response.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error('Error loading roles:', err);
        setError('Failed to load roles');
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, []);

  // Load user data if editing
  useEffect(() => {
    if (userId) {
      const loadUser = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/users/${userId}`, {
            headers: getAuthHeaders()
          });
          
          if (!response.ok) {
            throw new Error('Failed to load user');
          }
          
          const data = await response.json();
          const user = data.user;
          
          setFormData({
            name: user.name || '',
            email: user.email || '',
            roleId: user.role?.id || '',
            isActive: user.isActive !== false
          });
        } catch (err) {
          console.error('Error loading user:', err);
          setError('Failed to load user data');
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const url = userId ? `/api/users/${userId}` : '/api/users';
      const method = userId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      const data = await response.json();
      setSuccess(userId ? 'User updated successfully' : 'User created successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to user management page after a short delay
        setTimeout(() => {
          router.push('/settings/users');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/settings/users');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userId ? 'Edit User' : 'Create New User'}</CardTitle>
        <CardDescription>
          {userId ? 'Update user information and permissions' : 'Add a new user to the system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {rolesLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading roles...</span>
                </div>
              ) : (
                <Select
                  value={formData.roleId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Account Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || rolesLoading}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {userId ? 'Update User' : 'Create User'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}