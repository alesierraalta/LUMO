import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import UserEditForm from '@/components/users/user-edit-form';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Edit User - User Management',
  description: 'Edit user information and permissions'
};

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = params;

  // Validate UUID format
  if (!isValidUUID(id)) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Settings', href: '/settings' },
    { label: 'Users', href: '/settings/users' },
    { label: 'Edit User', href: `/settings/users/${id}/edit` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-2 text-gray-600">
            Update user information, role assignments, and account status
          </p>
        </div>

        {/* Edit Form */}
        <div className="max-w-4xl">
          <UserEditForm userId={id} />
        </div>
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