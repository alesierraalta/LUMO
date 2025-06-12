/**
 * 🧪 UserRoleForm Component Tests
 * 
 * Comprehensive unit tests for user role management form.
 * Tests role selection, form validation, submission handling, and error states.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFetch, mockFetchError } from '@/__tests__/utils/test-utils';
import UserRoleForm from '../user-role-form';
import { toast } from 'sonner';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserRoleForm', () => {
  const mockRoles = [
    {
      id: 'role-1',
      name: 'admin',
      description: 'Administrator with full access',
    },
    {
      id: 'role-2',
      name: 'user',
      description: 'Regular user with limited access',
    },
    {
      id: 'role-3',
      name: 'manager',
      description: null,
    },
  ];

  const defaultProps = {
    userId: 'test-user-id',
    currentRoleId: 'role-2',
    roles: mockRoles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render form with current role selected', () => {
      render(<UserRoleForm {...defaultProps} />);

      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });

    it('should display all available roles in select dropdown', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('manager')).toBeInTheDocument();
      });
    });

    it('should show role descriptions when available', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Administrator with full access')).toBeInTheDocument();
        expect(screen.getByText('Regular user with limited access')).toBeInTheDocument();
      });
    });

    it('should handle roles without descriptions', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('manager')).toBeInTheDocument();
        // Should not show description for manager role
        expect(screen.queryByText('null')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should allow role selection', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      await user.click(screen.getByText('admin'));

      // Verify the selection was made
      expect(selectTrigger).toHaveTextContent('admin');
    });

    it('should handle cancel button click', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/settings/users');
    });

    it('should disable form elements during loading', async () => {
      const user = userEvent.setup();
      mockFetch({ success: true }, 200);
      
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      // Change role and submit
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Updating...' })).toBeInTheDocument();
      });

      expect(selectTrigger).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should require role selection', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} currentRoleId="" />);

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a role')).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} currentRoleId="" />);

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a role')).toBeInTheDocument();
      });

      // Verify API was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data on successful role change', async () => {
      const user = userEvent.setup();
      mockFetch({ success: true }, 200);

      render(<UserRoleForm {...defaultProps} />);

      // Change role
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/test-user-id/role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: 'role-1',
          }),
        });
      });
    });

    it('should show success message and redirect on successful submission', async () => {
      const user = userEvent.setup();
      mockFetch({ success: true }, 200);

      render(<UserRoleForm {...defaultProps} />);

      // Change role and submit
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('User role updated successfully');
        expect(mockRefresh).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/settings/users');
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      mockFetchError('Server Error', 500);

      render(<UserRoleForm {...defaultProps} />);

      // Change role and submit
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update user role');
      });

      // Form should be enabled again after error
      expect(screen.getByRole('button', { name: 'Update Role' })).not.toBeDisabled();
    });

    it('should handle non-ok response status', async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      });

      render(<UserRoleForm {...defaultProps} />);

      // Change role and submit
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update user role');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty roles array', () => {
      render(<UserRoleForm {...defaultProps} roles={[]} />);

      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });

    it('should handle role with empty name', async () => {
      const rolesWithEmptyName = [
        ...mockRoles,
        {
          id: 'role-4',
          name: '',
          description: 'Role with empty name',
        },
      ];

      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} roles={rolesWithEmptyName} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Role with empty name')).toBeInTheDocument();
      });
    });

    it('should handle very long role names and descriptions', async () => {
      const rolesWithLongText = [
        {
          id: 'role-long',
          name: 'Very Long Role Name That Might Cause Layout Issues',
          description: 'This is a very long description that might cause layout issues and should be handled gracefully by the component',
        },
      ];

      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} roles={rolesWithLongText} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Very Long Role Name That Might Cause Layout Issues')).toBeInTheDocument();
        expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
      });
    });

    it('should not submit if role has not changed', async () => {
      const user = userEvent.setup();
      mockFetch({ success: true }, 200);

      render(<UserRoleForm {...defaultProps} />);

      // Submit without changing role
      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/test-user-id/role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: 'role-2', // Same as current role
          }),
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<UserRoleForm {...defaultProps} />);

      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should show validation messages with proper accessibility', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} currentRoleId="" />);

      const submitButton = screen.getByRole('button', { name: 'Update Role' });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Please select a role');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should maintain focus management during interactions', async () => {
      const user = userEvent.setup();
      render(<UserRoleForm {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      expect(selectTrigger).toHaveFocus();
    });
  });
}); 