import { Metadata } from 'next';
import UserRoleAssignment from '@/components/roles/user-role-assignment';

export const metadata: Metadata = {
  title: 'Asignar Roles a Usuario',
  description: 'Asigna roles específicos a usuarios del sistema',
};

export default function AssignRolesPage() {
  return (
    <div className="container mx-auto py-6">
      <UserRoleAssignment />
    </div>
  );
}