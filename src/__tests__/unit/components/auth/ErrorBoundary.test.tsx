import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthErrorBoundary } from '@/components/auth/ErrorBoundary';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock alert
global.alert = jest.fn();

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockLocation.href = '';
    mockLocation.reload.mockClear();
    (global.alert as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Clean up any error listeners
    window.removeEventListener('error', jest.fn());
  });

  describe('Normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.queryByText('Error de Autenticación')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch and display auth-related errors', async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      // Create error event that matches the auth pattern
      const error = new Error('useAuth hook error');
      const errorEvent = new ErrorEvent('error', {
        error: error,
        message: error.message,
        filename: 'test.js',
        lineno: 1,
        colno: 1
      });

      // Dispatch the error event
      window.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });

      expect(screen.getByText('useAuth hook error')).toBeInTheDocument();
      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    });

    it('should catch useUser errors', async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useUser is not available'),
        message: 'useUser is not available',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should catch authentication errors', async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('authentication failed'),
        message: 'authentication failed',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should catch publishable key errors', async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Publishable key not valid'),
        message: 'Publishable key not valid',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should display default error message when error message is not available', async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      // Create an error with empty message to trigger default
      const error = new Error('');
      error.message = ''; // Explicitly set empty message
      
      // Create error event where the event message contains useAuth to trigger the handler
      // but the error object itself has empty message
      const errorEvent = new ErrorEvent('error', {
        error: error,
        message: 'useAuth', // This triggers the auth error detection
        filename: 'test.js',
        lineno: 1,
        colno: 1
      });

      window.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
        // Since error.message is empty, it should display the default message
        expect(screen.getByText('Se ha producido un error en la autenticación.')).toBeInTheDocument();
      });
    });

    it('should not catch non-auth errors', () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Some other error'),
        message: 'Some other error',
      });

      fireEvent(window, errorEvent);

      // Should still show children since it's not an auth error
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.queryByText('Error de Autenticación')).not.toBeInTheDocument();
    });
  });

  describe('Error UI elements', () => {
    beforeEach(async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should display error information and help text', () => {
      expect(screen.getByText('Este error puede ocurrir cuando:')).toBeInTheDocument();
      expect(screen.getByText(/Las claves de API de autenticación/)).toBeInTheDocument();
      expect(screen.getByText(/El proveedor de autenticación/)).toBeInTheDocument();
      expect(screen.getByText(/Hay un problema con tu sesión/)).toBeInTheDocument();
    });

    it('should have "Volver al Inicio" button that redirects to home', () => {
      const homeButton = screen.getByText('Volver al Inicio');
      expect(homeButton).toBeInTheDocument();

      fireEvent.click(homeButton);
      expect(mockLocation.href).toBe('/');
    });

    it('should have "Reintentar" button that reloads the page', () => {
      const retryButton = screen.getByText('Reintentar');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockLocation.reload).toHaveBeenCalledTimes(1);
    });

    it('should have "Verificar Estado del Sistema" button', () => {
      const checkButton = screen.getByText('Verificar Estado del Sistema');
      expect(checkButton).toBeInTheDocument();
    });
  });

  describe('Environment info functionality', () => {
    it('should fetch and display environment info when error occurs', async () => {
      const mockEnvData = {
        NODE_ENV: 'test',
        hasAuthKeys: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnvData,
      });

      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Información de entorno:')).toBeInTheDocument();
        expect(screen.getByText(/"NODE_ENV": "test"/)).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/debug-env');
    });

    it('should handle environment info fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });

      // Should not display environment info section
      expect(screen.queryByText('Información de entorno:')).not.toBeInTheDocument();
    });

    it('should handle non-ok response from environment endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });

      expect(screen.queryByText('Información de entorno:')).not.toBeInTheDocument();
    });
  });

  describe('System status check', () => {
    beforeEach(async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should show system status when check button is clicked', async () => {
      const mockEnvData = { status: 'ok', version: '1.0.0' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnvData,
      });

      const checkButton = screen.getByText('Verificar Estado del Sistema');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          `Estado del sistema: ${JSON.stringify(mockEnvData, null, 2)}`
        );
      });
    });

    it('should show error message when system status check fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const checkButton = screen.getByText('Verificar Estado del Sistema');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'No se pudo verificar el estado del sistema'
        );
      });
    });

    it('should show error message when system status returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const checkButton = screen.getByText('Verificar Estado del Sistema');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'No se pudo verificar el estado del sistema'
        );
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(
        <AuthErrorBoundary>
          <div data-testid="child-content">Test Content</div>
        </AuthErrorBoundary>
      );

      const errorEvent = new ErrorEvent('error', {
        error: new Error('useAuth error'),
        message: 'useAuth error',
      });

      fireEvent(window, errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
      });
    });

    it('should have proper alert structure', () => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.className).toContain('border-destructive');
    });

    it('should have accessible buttons', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should have proper heading structure', () => {
      // The AlertTitle should be rendered as a heading-like element
      expect(screen.getByText('Error de Autenticación')).toBeInTheDocument();
    });
  });
}); 