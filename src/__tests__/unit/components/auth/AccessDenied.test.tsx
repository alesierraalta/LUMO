/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessDenied } from '@/components/auth/AccessDenied';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('AccessDenied', () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  describe('Basic rendering', () => {
    test('should render with default props', () => {
      render(<AccessDenied message="Access denied" />);
      
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(screen.getByText('¿Qué puedes hacer?')).toBeInTheDocument();
    });

    test('should render with custom message', () => {
      const customMessage = 'You do not have permission to access this resource';
      render(<AccessDenied message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Type variants', () => {
    test('should render auth type correctly', () => {
      render(<AccessDenied message="Please log in" type="auth" />);
      
      expect(screen.getByText('Inicio de sesión requerido')).toBeInTheDocument();
      expect(screen.getByText('Inicia sesión con tu cuenta para continuar.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });

    test('should render database type correctly', () => {
      render(<AccessDenied message="Database error" type="database" />);
      
      expect(screen.getByText('Error de sistema')).toBeInTheDocument();
      expect(screen.getByText('Espera unos momentos e intenta nuevamente. Si el problema persiste, contacta al administrador.')).toBeInTheDocument();
    });

    test('should render notfound type correctly', () => {
      render(<AccessDenied message="Account not found" type="notfound" />);
      
      expect(screen.getByText('Cuenta no configurada')).toBeInTheDocument();
      expect(screen.getByText('Contacta al administrador del sistema para que configure tu cuenta.')).toBeInTheDocument();
    });

    test('should render permission type correctly (default)', () => {
      render(<AccessDenied message="No permission" type="permission" />);
      
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
      expect(screen.getByText('Solicita permisos adicionales al administrador del sistema.')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('should render icons for different types', () => {
      const { container: authContainer } = render(<AccessDenied message="Login required" type="auth" />);
      expect(authContainer.querySelector('svg')).toBeInTheDocument();

      const { container: dbContainer } = render(<AccessDenied message="Database error" type="database" />);
      expect(dbContainer.querySelector('svg')).toBeInTheDocument();

      const { container: notfoundContainer } = render(<AccessDenied message="Not found" type="notfound" />);
      expect(notfoundContainer.querySelector('svg')).toBeInTheDocument();

      const { container: permissionContainer } = render(<AccessDenied message="No permission" type="permission" />);
      expect(permissionContainer.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Buttons and actions', () => {
    test('should render sign-in button for auth type', () => {
      render(<AccessDenied message="Login required" type="auth" />);
      
      const signInButton = screen.getByRole('link', { name: 'Iniciar sesión' });
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).toHaveAttribute('href', '/sign-in');
    });

    test('should render retry button when showRetry is true and type is not auth', () => {
      render(<AccessDenied message="Error" type="database" showRetry={true} />);
      
      const retryButton = screen.getByRole('button', { name: 'Intentar nuevamente' });
      expect(retryButton).toBeInTheDocument();
    });

    test('should not render retry button when showRetry is false', () => {
      render(<AccessDenied message="Error" type="database" showRetry={false} />);
      
      expect(screen.queryByRole('button', { name: 'Intentar nuevamente' })).not.toBeInTheDocument();
    });

    test('should not render retry button for auth type even when showRetry is true', () => {
      render(<AccessDenied message="Login required" type="auth" showRetry={true} />);
      
      expect(screen.queryByRole('button', { name: 'Intentar nuevamente' })).not.toBeInTheDocument();
    });

    test('should render contact button when showContact is true', () => {
      render(<AccessDenied message="Error" showContact={true} />);
      
      const contactButton = screen.getByRole('link', { name: 'Contactar administrador' });
      expect(contactButton).toBeInTheDocument();
      expect(contactButton).toHaveAttribute('href', '/contact');
    });

    test('should not render contact button when showContact is false', () => {
      render(<AccessDenied message="Error" showContact={false} />);
      
      expect(screen.queryByRole('link', { name: 'Contactar administrador' })).not.toBeInTheDocument();
    });

    test('should always render home button', () => {
      render(<AccessDenied message="Error" />);
      
      const homeButton = screen.getByRole('link', { name: 'Volver al inicio' });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });

    test('should call window.location.reload when retry button is clicked', () => {
      render(<AccessDenied message="Error" type="database" showRetry={true} />);
      
      const retryButton = screen.getByRole('button', { name: 'Intentar nuevamente' });
      fireEvent.click(retryButton);
      
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert variants', () => {
    test('should use destructive variant for permission type', () => {
      render(<AccessDenied message="No permission" type="permission" />);
      
      // The alert should have destructive styling
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('should use destructive variant for database type', () => {
      render(<AccessDenied message="Database error" type="database" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('should use default variant for auth type', () => {
      render(<AccessDenied message="Login required" type="auth" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('should use default variant for notfound type', () => {
      render(<AccessDenied message="Not found" type="notfound" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      render(<AccessDenied message="Access denied" />);
      
      // Card title should be a heading
      expect(screen.getByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
    });

    test('should have proper alert structure', () => {
      render(<AccessDenied message="Access denied" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('¿Qué puedes hacer?')).toBeInTheDocument();
    });

    test('should have accessible buttons and links', () => {
      render(<AccessDenied message="Error" type="database" />);
      
      const retryButton = screen.getByRole('button', { name: 'Intentar nuevamente' });
      const contactLink = screen.getByRole('link', { name: 'Contactar administrador' });
      const homeLink = screen.getByRole('link', { name: 'Volver al inicio' });
      
      expect(retryButton).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Props combinations', () => {
    test('should handle all props disabled', () => {
      render(
        <AccessDenied 
          message="Custom error" 
          type="database" 
          showRetry={false} 
          showContact={false} 
        />
      );
      
      expect(screen.getByText('Custom error')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Intentar nuevamente' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Contactar administrador' })).not.toBeInTheDocument();
      // Home button should still be present
      expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
    });

    test('should handle all props enabled', () => {
      render(
        <AccessDenied 
          message="Custom error" 
          type="database" 
          showRetry={true} 
          showContact={true} 
        />
      );
      
      expect(screen.getByText('Custom error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Intentar nuevamente' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contactar administrador' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
    });
  });

  describe('Layout and styling', () => {
    test('should render with proper card structure', () => {
      render(<AccessDenied message="Test message" />);
      
      // Should have card container
      const card = screen.getByRole('heading', { name: 'Acceso denegado' }).closest('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    test('should have centered layout', () => {
      const { container } = render(<AccessDenied message="Test message" />);
      
      // Should have flex centering classes
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
}); 