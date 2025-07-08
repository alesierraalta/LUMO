import { Metadata } from 'next';
import RoleManagement from '@/components/roles/role-management';

export const metadata: Metadata = {
  title: 'Gestión de Roles - LUMO',
  description: 'Administra los roles y permisos del sistema',
};

export default function RolesPage() {
  return (
    <div className="container mx-auto py-6">
      <RoleManagement />
    </div>
  );
} 