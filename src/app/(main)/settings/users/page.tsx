import { Metadata } from 'next';
import UserManagementTable from '@/components/users/user-management-table';
import Breadcrumbs from '@/components/ui/breadcrumbs';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios - Sistema de Inventario',
  description: 'Administra usuarios del sistema con funcionalidades avanzadas de búsqueda, filtrado y gestión',
};

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Configuración', href: '/settings' },
  { label: 'Usuarios', href: '/settings/users', active: true },
];

export default function UsersPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </nav>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-6 text-gray-900 sm:text-3xl">
                Gestión de Usuarios
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Administra usuarios del sistema con funcionalidades avanzadas de búsqueda, filtrado y gestión de roles
              </p>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <UserManagementTable />
      </div>
    </div>
  );
}