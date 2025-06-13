/**
 * 🧪 PermissionGuard Component Tests
 * 
 * Comprehensive unit tests for authentication permission guards.
 * Tests access control, loading states, permission checking, and fallback rendering.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createTestUser, createTestAdmin } from '../../../test-utils';
import { PermissionGuard, PermissionButton, usePermissions } from '../permission-guard';

// Mock the auth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the permissions client
const mockHasPermission = jest.fn();
const mockHasAllPermissions = jest.fn();
const mockHasAnyPermission = jest.fn();

jest.mock('@/lib/permissions-client', () => ({
  hasPermission: (...args: any[]) => mockHasPermission(...args),
  hasAllPermissions: (...args: any[]) => mockHasAllPermissions(...args),
  hasAnyPermission: (...args: any[]) => mockHasAnyPermission(...args),
}));

describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });

      render(
        <PermissionGuard permission="read:users">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      // Check for loading spinner by data-testid instead of role
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should have proper loading accessibility attributes', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });

      render(
        <PermissionGuard permission="read:users">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });
    });

    it('should show login alert when user is not authenticated', () => {
      render(
        <PermissionGuard permission="read:users">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Debes iniciar sesión para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      render(
        <PermissionGuard 
          permission="read:users"
          fallback={<div>Custom Login Required</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Custom Login Required')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render nothing when showAlert is false and no fallback', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });

      const { container } = render(
        <PermissionGuard permission="read:users" showAlert={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      // Check that no meaningful content is rendered (ignoring theme scripts)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Permission Checking - Single Permission', () => {
    const testUser = createTestUser({
      permissions: ['read:products', 'write:products'],
    });

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
      });
    });

    it('should render children when user has required permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <PermissionGuard permission="read:products">
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith(testUser, 'read:products');
    });

    it('should show access denied when user lacks permission', () => {
      mockHasPermission.mockReturnValue(false);

      render(
        <PermissionGuard permission="admin:users">
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Permission Checking - Multiple Permissions', () => {
    const testUser = createTestUser({
      permissions: ['read:products', 'write:products'],
    });

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
      });
    });

    it('should render children when user has all required permissions (requireAll=true)', () => {
      mockHasAllPermissions.mockReturnValue(true);

      render(
        <PermissionGuard 
          permissions={['read:products', 'write:products']}
          requireAll={true}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(testUser, ['read:products', 'write:products']);
    });

    it('should render children when user has any required permission (requireAll=false)', () => {
      mockHasAnyPermission.mockReturnValue(true);

      render(
        <PermissionGuard 
          permissions={['read:products', 'admin:users']}
          requireAll={false}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith(testUser, ['read:products', 'admin:users']);
    });

    it('should deny access when user lacks all permissions (requireAll=true)', () => {
      mockHasAllPermissions.mockReturnValue(false);

      render(
        <PermissionGuard 
          permissions={['admin:users', 'admin:system']}
          requireAll={true}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should deny access when user lacks any permission (requireAll=false)', () => {
      mockHasAnyPermission.mockReturnValue(false);

      render(
        <PermissionGuard 
          permissions={['admin:users', 'admin:system']}
          requireAll={false}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    const testUser = createTestUser();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
      });
    });

    it('should deny access when no permission is specified', () => {
      render(
        <PermissionGuard>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should deny access when empty permissions array is provided', () => {
      render(
        <PermissionGuard permissions={[]}>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});

describe('PermissionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Unauthenticated States', () => {
    it('should not render when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });

      const { container } = render(
        <PermissionButton permission="read:users">
          Test Button
        </PermissionButton>
      );

      // Check that no button is rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        refreshUser: jest.fn(),
      });

      const { container } = render(
        <PermissionButton permission="read:users">
          Test Button
        </PermissionButton>
      );

      // Check that no button is rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Permission-based Rendering', () => {
    const testUser = createTestUser();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
        isAuthenticated: true,
        refreshUser: jest.fn(),
      });
    });

    it('should render button when user has permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <PermissionButton permission="read:products">
          Click Me
        </PermissionButton>
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should not render when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: createTestUser(['write:products']), // Different permission
        isLoading: false,
        isAuthenticated: true,
        refreshUser: jest.fn(),
      });

      // Mock hasPermission to return false for 'read:users'
      mockHasPermission.mockReturnValue(false);

      const { container } = render(
        <PermissionButton permission="read:users">
          Test Button
        </PermissionButton>
      );

      // Check that no button is rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle click events when rendered', async () => {
      mockHasPermission.mockReturnValue(true);
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PermissionButton permission="read:products" onClick={handleClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply custom props correctly', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <PermissionButton 
          permission="read:products"
          variant="destructive"
          size="lg"
          disabled={true}
          className="custom-class"
        >
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Multiple Permissions', () => {
    const testUser = createTestUser();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
      });
    });

    it('should render when user has all required permissions', () => {
      mockHasAllPermissions.mockReturnValue(true);

      render(
        <PermissionButton 
          permissions={['read:products', 'write:products']}
          requireAll={true}
        >
          Click Me
        </PermissionButton>
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should render when user has any required permission', () => {
      mockHasAnyPermission.mockReturnValue(true);

      render(
        <PermissionButton 
          permissions={['read:products', 'admin:users']}
          requireAll={false}
        >
          Click Me
        </PermissionButton>
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });
  });
});

describe('usePermissions Hook', () => {
  const TestComponent: React.FC = () => {
    const { hasPermission, hasAllPermissions, hasAnyPermission, user } = usePermissions();
    
    return (
      <div>
        <div data-testid="user-id">{user?.id || 'no-user'}</div>
        <div data-testid="has-read">{hasPermission('read:products').toString()}</div>
        <div data-testid="has-all">{hasAllPermissions(['read:products', 'write:products']).toString()}</div>
        <div data-testid="has-any">{hasAnyPermission(['read:products', 'admin:users']).toString()}</div>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct permission checks for authenticated user', () => {
    const testUser = createTestUser();
    mockUseAuth.mockReturnValue({
      user: testUser,
      isLoading: false,
    });

    mockHasPermission.mockReturnValue(true);
    mockHasAllPermissions.mockReturnValue(false);
    mockHasAnyPermission.mockReturnValue(true);

    render(<TestComponent />);

    expect(screen.getByTestId('user-id')).toHaveTextContent(testUser.id);
    expect(screen.getByTestId('has-read')).toHaveTextContent('true');
    expect(screen.getByTestId('has-all')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any')).toHaveTextContent('true');
  });

  it('should handle unauthenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    mockHasPermission.mockReturnValue(false);
    mockHasAllPermissions.mockReturnValue(false);
    mockHasAnyPermission.mockReturnValue(false);

    render(<TestComponent />);

    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
    expect(screen.getByTestId('has-read')).toHaveTextContent('false');
    expect(screen.getByTestId('has-all')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any')).toHaveTextContent('false');
  });
}); 