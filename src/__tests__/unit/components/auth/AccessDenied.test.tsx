/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { AccessDenied } from '@/components/auth/AccessDenied'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock window.location.reload
const mockReload = jest.fn()
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
})

describe('AccessDenied', () => {
  beforeEach(() => {
    mockReload.mockClear()
  })

  describe('Default behavior', () => {
    test('should render with default props', () => {
      render(<AccessDenied message="Test message" />)
      
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
      expect(screen.getByText('¿Qué puedes hacer?')).toBeInTheDocument()
      expect(screen.getByText('Solicita permisos adicionales al administrador del sistema.')).toBeInTheDocument()
    })

    test('should show default buttons', () => {
      render(<AccessDenied message="Test message" />)
      
      expect(screen.getByText('Intentar nuevamente')).toBeInTheDocument()
      expect(screen.getByText('Contactar administrador')).toBeInTheDocument()
      expect(screen.getByText('Volver al inicio')).toBeInTheDocument()
    })

    test('should have correct links', () => {
      render(<AccessDenied message="Test message" />)
      
      const contactLink = screen.getByText('Contactar administrador').closest('a')
      const homeLink = screen.getByText('Volver al inicio').closest('a')
      
      expect(contactLink).toHaveAttribute('href', '/contact')
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('Auth type', () => {
    test('should render auth-specific content', () => {
      render(<AccessDenied message="Login required" type="auth" />)
      
      expect(screen.getByText('Inicio de sesión requerido')).toBeInTheDocument()
      expect(screen.getByText('Inicia sesión con tu cuenta para continuar.')).toBeInTheDocument()
      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    })

    test('should have sign-in link for auth type', () => {
      render(<AccessDenied message="Login required" type="auth" />)
      
      const signInLink = screen.getByText('Iniciar sesión').closest('a')
      expect(signInLink).toHaveAttribute('href', '/sign-in')
    })

    test('should not show retry button for auth type', () => {
      render(<AccessDenied message="Login required" type="auth" />)
      
      expect(screen.queryByText('Intentar nuevamente')).not.toBeInTheDocument()
    })
  })

  describe('Database type', () => {
    test('should render database-specific content', () => {
      render(<AccessDenied message="Database error" type="database" />)
      
      expect(screen.getByText('Error de sistema')).toBeInTheDocument()
      expect(screen.getByText('Espera unos momentos e intenta nuevamente. Si el problema persiste, contacta al administrador.')).toBeInTheDocument()
    })

    test('should show retry button for database type', () => {
      render(<AccessDenied message="Database error" type="database" />)
      
      expect(screen.getByText('Intentar nuevamente')).toBeInTheDocument()
    })
  })

  describe('Not found type', () => {
    test('should render notfound-specific content', () => {
      render(<AccessDenied message="Account not found" type="notfound" />)
      
      expect(screen.getByText('Cuenta no configurada')).toBeInTheDocument()
      expect(screen.getByText('Contacta al administrador del sistema para que configure tu cuenta.')).toBeInTheDocument()
    })
  })

  describe('Permission type', () => {
    test('should render permission-specific content', () => {
      render(<AccessDenied message="No permission" type="permission" />)
      
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.getByText('Solicita permisos adicionales al administrador del sistema.')).toBeInTheDocument()
    })
  })

  describe('Button visibility controls', () => {
    test('should hide retry button when showRetry is false', () => {
      render(<AccessDenied message="Test message" showRetry={false} />)
      
      expect(screen.queryByText('Intentar nuevamente')).not.toBeInTheDocument()
    })

    test('should hide contact button when showContact is false', () => {
      render(<AccessDenied message="Test message" showContact={false} />)
      
      expect(screen.queryByText('Contactar administrador')).not.toBeInTheDocument()
    })

    test('should hide both buttons when both props are false', () => {
      render(<AccessDenied message="Test message" showRetry={false} showContact={false} />)
      
      expect(screen.queryByText('Intentar nuevamente')).not.toBeInTheDocument()
      expect(screen.queryByText('Contactar administrador')).not.toBeInTheDocument()
      expect(screen.getByText('Volver al inicio')).toBeInTheDocument() // Home button should still be there
    })
  })

  describe('Retry functionality', () => {
    test('should call window.location.reload when retry button is clicked', () => {
      render(<AccessDenied message="Test message" type="database" />)
      
      const retryButton = screen.getByText('Intentar nuevamente')
      fireEvent.click(retryButton)
      
      expect(mockReload).toHaveBeenCalledTimes(1)
    })

    test('should not show retry button for auth type even when showRetry is true', () => {
      render(<AccessDenied message="Login required" type="auth" showRetry={true} />)
      
      expect(screen.queryByText('Intentar nuevamente')).not.toBeInTheDocument()
    })
  })

  describe('Icon rendering', () => {
    test('should render correct icon for each type', () => {
      const { rerender } = render(<AccessDenied message="Test" type="auth" />)
      expect(document.querySelector('.lucide-user-x')).toBeInTheDocument()

      rerender(<AccessDenied message="Test" type="database" />)
      expect(document.querySelector('.lucide-wifi')).toBeInTheDocument()

      rerender(<AccessDenied message="Test" type="notfound" />)
      expect(document.querySelector('.lucide-user-x')).toBeInTheDocument()

      rerender(<AccessDenied message="Test" type="permission" />)
      expect(document.querySelector('.lucide-lock')).toBeInTheDocument()
    })
  })

  describe('Alert variants', () => {
    test('should use correct alert variant for each type', () => {
      const { rerender } = render(<AccessDenied message="Test" type="auth" />)
      let alert = document.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()

      rerender(<AccessDenied message="Test" type="database" />)
      alert = document.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
      // Check for destructive styling (border-destructive or similar)
      expect(alert?.className).toContain('destructive')

      rerender(<AccessDenied message="Test" type="permission" />)
      alert = document.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert?.className).toContain('destructive')
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<AccessDenied message="Test message" />)
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    test('should have descriptive button text', () => {
      render(<AccessDenied message="Test message" />)
      
      expect(screen.getByRole('button', { name: 'Intentar nuevamente' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Contactar administrador' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument()
    })
  })

  describe('Layout and styling', () => {
    test('should render with proper card structure', () => {
      render(<AccessDenied message="Test message" />)
      
      expect(document.querySelector('.min-h-\\[400px\\]')).toBeInTheDocument()
      expect(document.querySelector('.max-w-md')).toBeInTheDocument()
    })

    test('should center content properly', () => {
      render(<AccessDenied message="Test message" />)
      
      const container = document.querySelector('.flex.items-center.justify-center')
      expect(container).toBeInTheDocument()
    })
  })
}) 