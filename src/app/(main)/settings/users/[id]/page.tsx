import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Edit, ArrowLeft, Shield, Mail, Calendar, User, UserCheck } from 'lucide-react';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Details - User Management',
  description: 'View user information and details'
};

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      'Content-Type': 'application/json',
      'X-Development-Mode': 'true'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

async function getUserDetails(userId: string) {
  try {
    // In a real app, you'd make an API call here
    // For now, we'll return mock data structure
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}`, {
      headers: getAuthHeaders(),
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = params;

  // Validate UUID format
  if (!isValidUUID(id)) {
    notFound();
  }

  const user = await getUserDetails(id);

  if (!user) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Settings', href: '/settings' },
    { label: 'Users', href: '/settings/users' },
    { label: 'User Details', href: `/settings/users/${id}` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="mt-2 text-gray-600">
              View complete user information and account details
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/settings/users">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/settings/users/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Link>
            </Button>
          </div>
        </div>

        {/* User Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Primary user account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || 'No name'}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
                  </div>
                </div>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">Email Address</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                  <p className="text-sm text-gray-500">Member Since</p>
                </div>
              </div>

              {user.updatedAt && (
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(user.updatedAt)}</p>
                    <p className="text-sm text-gray-500">Last Updated</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                User access level and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.role?.name || 'No role assigned'}</p>
                    <p className="text-sm text-gray-500">Current Role</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {user.role?.name?.toUpperCase() || 'NONE'}
                </Badge>
              </div>

              {user.role?.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Role Description</p>
                    <p className="text-sm text-gray-600">{user.role.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Account Status</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {user.isActive ? 'Account is active and accessible' : 'Account is inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>
              Recent user activity and account changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-xs text-gray-500">User account was created</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
              </div>

              {user.updatedAt && user.updatedAt !== user.createdAt && (
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account Updated</p>
                      <p className="text-xs text-gray-500">User information was modified</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(user.updatedAt)}</span>
                </div>
              )}

              <div className="flex items-center justify-center py-8 text-gray-500">
                <p className="text-sm">No additional activity records available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generate static params for commonly accessed users (optional optimization)
export async function generateStaticParams() {
  // In a real app, you might want to pre-generate pages for some users
  // For now, we'll return an empty array to use dynamic rendering
  return [];
}