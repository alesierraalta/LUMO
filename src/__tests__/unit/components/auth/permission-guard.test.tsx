import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionGuard, PermissionButton, usePermissions } from '@/components/auth/permission-guard';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the permissions client functions
const mockHasPermission = jest.fn();
const mockHasAllPermissions = jest.fn();
const mockHasAnyPermission = jest.fn();

jest.mock('@/lib/permissions-client', () => ({
  hasPermission: (...args: any[]) => mockHasPermission(...args),
  hasAllPermissions: (...args: any[]) => mockHasAllPermissions(...args),
  hasAnyPermission: (...args: any[]) => mockHasAnyPermission(...args),
}));

// Test component for usePermissions hook
const TestPermissionsHook = () => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, user } = usePermissions();
  
  return (
    <div>
      <div data-testid="user-info">{user ? user.email : 'No user'}</div>
      <div data-testid="has-read">{hasPermission('read').toString()}</div>
      <div data-testid="has-all">{hasAllPermissions(['read', 'write']).toString()}</div>
      <div data-testid="has-any">{hasAnyPermission(['read', 'admin']).toString()}</div>
    </div>
  );
};

describe('PermissionGuard', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <PermissionGuard permission="read">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('No user scenarios', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });
    });

    it('should show login alert when no user and showAlert is true', () => {
      render(
        <PermissionGuard permission="read" showAlert={true}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Debes iniciar sesión para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback when no user and fallback provided', () => {
      render(
        <PermissionGuard 
          permission="read" 
          fallback={<div data-testid="custom-fallback">Please login</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render nothing when no user and showAlert is false', () => {
      const { container } = render(
        <PermissionGuard permission="read" showAlert={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Single permission checks', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
    });

    it('should render children when user has required permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <PermissionGuard permission="read">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith(mockUser, 'read');
    });

    it('should show permission denied alert when user lacks permission', () => {
      mockHasPermission.mockReturnValue(false);

      render(
        <PermissionGuard permission="read" showAlert={true}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback when user lacks permission and fallback provided', () => {
      mockHasPermission.mockReturnValue(false);

      render(
        <PermissionGuard 
          permission="read" 
          fallback={<div data-testid="no-permission">Access Denied</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('no-permission')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Multiple permissions checks', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
    });

    it('should use hasAllPermissions when requireAll is true', () => {
      mockHasAllPermissions.mockReturnValue(true);

      render(
        <PermissionGuard permissions={['read', 'write']} requireAll={true}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(mockUser, ['read', 'write']);
    });

    it('should use hasAnyPermission when requireAll is false', () => {
      mockHasAnyPermission.mockReturnValue(true);

      render(
        <PermissionGuard permissions={['read', 'admin']} requireAll={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith(mockUser, ['read', 'admin']);
    });

    it('should deny access when user lacks required permissions', () => {
      mockHasAllPermissions.mockReturnValue(false);

      render(
        <PermissionGuard permissions={['read', 'write']} requireAll={true}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
    });

    it('should deny access when no permission or permissions specified', () => {
      render(
        <PermissionGuard>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should deny access when permissions array is empty', () => {
      render(
        <PermissionGuard permissions={[]}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No tienes permisos suficientes para acceder a esta sección.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render nothing when access denied and showAlert is false', () => {
      mockHasPermission.mockReturnValue(false);

      const { container } = render(
        <PermissionGuard permission="read" showAlert={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

describe('PermissionButton', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and no user states', () => {
    it('should render nothing when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { container } = render(
        <PermissionButton permission="read" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when no user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      const { container } = render(
        <PermissionButton permission="read" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Permission checks', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
    });

    it('should render button when user has single permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <PermissionButton permission="read" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith(mockUser, 'read');
    });

    it('should render button when user has all required permissions', () => {
      mockHasAllPermissions.mockReturnValue(true);

      render(
        <PermissionButton permissions={['read', 'write']} requireAll={true} onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(mockUser, ['read', 'write']);
    });

    it('should render button when user has any required permission', () => {
      mockHasAnyPermission.mockReturnValue(true);

      render(
        <PermissionButton permissions={['read', 'admin']} requireAll={false} onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith(mockUser, ['read', 'admin']);
    });

    it('should not render button when user lacks permission', () => {
      mockHasPermission.mockReturnValue(false);

      const { container } = render(
        <PermissionButton permission="admin" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Button functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
      mockHasPermission.mockReturnValue(true);
    });

    it('should handle click events', () => {
      render(
        <PermissionButton permission="read" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should apply custom className', () => {
      render(
        <PermissionButton permission="read" className="custom-class" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toHaveClass('custom-class');
    });

    it('should handle disabled state', () => {
      render(
        <PermissionButton permission="read" disabled={true} onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeDisabled();
    });

    it('should apply different variants', () => {
      render(
        <PermissionButton permission="read" variant="destructive" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply different sizes', () => {
      render(
        <PermissionButton permission="read" size="sm" onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button.className).toContain('h-8'); // sm size uses h-8
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });
    });

    it('should not render when no permission specified', () => {
      const { container } = render(
        <PermissionButton onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when permissions array is empty', () => {
      const { container } = render(
        <PermissionButton permissions={[]} onClick={mockOnClick}>
          Click Me
        </PermissionButton>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

describe('usePermissions hook', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
  });

  it('should return permission check functions and user', () => {
    mockHasPermission.mockReturnValue(true);
    mockHasAllPermissions.mockReturnValue(false);
    mockHasAnyPermission.mockReturnValue(true);

    render(<TestPermissionsHook />);

    expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('has-read')).toHaveTextContent('true');
    expect(screen.getByTestId('has-all')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any')).toHaveTextContent('true');

    expect(mockHasPermission).toHaveBeenCalledWith(mockUser, 'read');
    expect(mockHasAllPermissions).toHaveBeenCalledWith(mockUser, ['read', 'write']);
    expect(mockHasAnyPermission).toHaveBeenCalledWith(mockUser, ['read', 'admin']);
  });

  it('should handle no user scenario', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    mockHasPermission.mockReturnValue(false);
    mockHasAllPermissions.mockReturnValue(false);
    mockHasAnyPermission.mockReturnValue(false);

    render(<TestPermissionsHook />);

    expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    expect(screen.getByTestId('has-read')).toHaveTextContent('false');
    expect(screen.getByTestId('has-all')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any')).toHaveTextContent('false');

    expect(mockHasPermission).toHaveBeenCalledWith(null, 'read');
    expect(mockHasAllPermissions).toHaveBeenCalledWith(null, ['read', 'write']);
    expect(mockHasAnyPermission).toHaveBeenCalledWith(null, ['read', 'admin']);
  });
}); 