import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import UserRoleForm from '@/components/auth/user-role-form';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockRefresh = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  });
  
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

const defaultProps = {
  userId: 'user-123',
  currentRoleId: 'role2',
  roles: [
    { id: 'role1', name: 'admin', description: 'Administrator role' },
    { id: 'role2', name: 'user', description: 'Regular user role' },
    { id: 'role3', name: 'manager', description: null },
  ],
};

describe('UserRoleForm', () => {
  describe('Basic rendering', () => {
    it('should render the form with role selection', () => {
      render(<UserRoleForm {...defaultProps} />);
      
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Update Role')).toBeInTheDocument();
    });

    it('should display current role as selected', () => {
      render(<UserRoleForm {...defaultProps} />);
      
      // The current role should be displayed in the select trigger
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('Regular user role')).toBeInTheDocument();
    });

    it('should render form elements with correct types', () => {
      render(<UserRoleForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      const submitButton = screen.getByText('Update Role');
      
      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Form interactions', () => {
    it('should navigate to users page when cancel is clicked', () => {
      render(<UserRoleForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/settings/users');
    });

    it('should have accessible form structure', () => {
      render(<UserRoleForm {...defaultProps} />);
      
      // Check for form element using querySelector since HTML forms don't have role="form" by default
      const formElement = document.querySelector('form');
      expect(formElement).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should submit form with current role when no changes made', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<UserRoleForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Update Role');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123/role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: 'role2', // Current role
          }),
        });
      });
      
      expect(toast.success).toHaveBeenCalledWith('User role updated successfully');
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/settings/users');
    });

    it('should handle submission errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(<UserRoleForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Update Role');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update user role');
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<UserRoleForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Update Role');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update user role');
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state during submission', async () => {
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<UserRoleForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Update Role');
      fireEvent.click(submitButton);
      
      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });
      
      // Buttons should be disabled
      expect(screen.getByText('Updating...')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    it('should restore normal state after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<UserRoleForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Update Role');
      fireEvent.click(submitButton);
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty roles array', () => {
      render(<UserRoleForm {...defaultProps} roles={[]} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });

    it('should handle missing current role', () => {
      const propsWithMissingRole = {
        ...defaultProps,
        currentRoleId: 'non-existent-role',
      };
      
      render(<UserRoleForm {...propsWithMissingRole} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });

    it('should handle roles without descriptions', () => {
      const rolesWithoutDesc = [
        { id: 'role1', name: 'admin', description: null },
        { id: 'role2', name: 'user', description: null },
      ];
      
      render(<UserRoleForm {...defaultProps} roles={rolesWithoutDesc} currentRoleId="role1" />);

      // Should show role name without description - use getAllByText since text appears in multiple places
      expect(screen.getAllByText('admin')).toHaveLength(2); // Once in select value, once in option
      expect(screen.queryByText('Administrator role')).not.toBeInTheDocument();
    });

    it('should handle very long role names', () => {
      const longNameRoles = {
        ...defaultProps,
        roles: [
          { 
            id: 'role1', 
            name: 'Very Long Role Name That Might Cause Layout Issues', 
            description: 'This is a very long description that might cause layout issues' 
          },
        ],
        currentRoleId: 'role1',
      };
      
      render(<UserRoleForm {...longNameRoles} />);
      
      // Should render without crashing
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Update Role')).toBeInTheDocument();
    });
  });

  describe('Component props validation', () => {
    it('should handle different userId formats', () => {
      const propsWithDifferentId = {
        ...defaultProps,
        userId: 'user_with_underscores_123',
      };
      
      render(<UserRoleForm {...propsWithDifferentId} />);
      
      expect(screen.getByText('Update Role')).toBeInTheDocument();
    });

    it('should handle roles with special characters in names', () => {
      const specialRoles = {
        ...defaultProps,
        roles: [
          { id: 'role1', name: 'admin@company.com', description: 'Email-based role' },
          { id: 'role2', name: 'user-level-1', description: 'Hyphenated role' },
        ],
        currentRoleId: 'role1',
      };
      
      render(<UserRoleForm {...specialRoles} />);
      
      expect(screen.getByText('admin@company.com')).toBeInTheDocument();
    });
  });
}); 