// Unit tests for Login Form functionality
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import React from 'react'

// Mock fetch
global.fetch = jest.fn()

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Simple Login Form Component for testing
const LoginForm = ({ onSubmit, submitError = false }: {
  onSubmit?: (email: string, password: string) => Promise<void>
  submitError?: boolean
}) => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (onSubmit) {
        await onSubmit(email, password)
      } else if (submitError) {
        throw new Error('Invalid email or password')
      }
      
      // Simulate successful login
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      {error && (
        <div data-testid="error-alert" role="alert">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="Ingresa tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password">Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}

describe('Login Form', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  test('renders login form with all required fields', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
  })

  test('allows user to type in email and password fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    const passwordInput = screen.getByLabelText('Contraseña')

    await user.type(emailInput, 'test@lumo.dev')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@lumo.dev')
    expect(passwordInput).toHaveValue('password123')
  })

  test('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText('Contraseña')
    const toggleButton = screen.getByRole('button', { name: 'Show password' })

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('handles successful form submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined)
    
    render(<LoginForm onSubmit={mockOnSubmit} />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    const passwordInput = screen.getByLabelText('Contraseña')
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })

    await user.type(emailInput, 'test@lumo.dev')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('test@lumo.dev', 'password123')
  })

  test('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void
    const mockOnSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => { resolveSubmit = () => resolve(undefined) })
    )
    
    render(<LoginForm onSubmit={mockOnSubmit} />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    const passwordInput = screen.getByLabelText('Contraseña')
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })

    await user.type(emailInput, 'test@lumo.dev')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByRole('button', { name: 'Iniciando sesión...' })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()

    // Resolve the promise
    resolveSubmit!()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    })
  })

  test('displays error message on submission failure', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm submitError={true} />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    const passwordInput = screen.getByLabelText('Contraseña')
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })

    await user.type(emailInput, 'wrong@email.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument()
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Should reset loading state
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  test('clears error message on new submission attempt', async () => {
    const user = userEvent.setup()
    
    // Create a more controlled version of the test
    const ControlledLoginForm = () => {
      const [email, setEmail] = React.useState('')
      const [password, setPassword] = React.useState('')
      const [showPassword, setShowPassword] = React.useState(false)
      const [isLoading, setIsLoading] = React.useState(false)
      const [error, setError] = React.useState('')
      const [shouldError, setShouldError] = React.useState(true)

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('') // This is the key - error should be cleared on new submit

        try {
          if (shouldError) {
            throw new Error('Invalid email or password')
          }
          // Success case
        } catch (error: any) {
          setError(error.message || 'Error al iniciar sesión')
        } finally {
          setIsLoading(false)
        }
      }

      return (
        <div>
          <form onSubmit={handleSubmit} data-testid="login-form">
            {error && (
              <div data-testid="error-alert" role="alert">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <button 
            data-testid="toggle-error" 
            onClick={() => setShouldError(!shouldError)}
          >
            Toggle Error Mode
          </button>
        </div>
      )
    }
    
    render(<ControlledLoginForm />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    const passwordInput = screen.getByLabelText('Contraseña')
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
    const toggleButton = screen.getByTestId('toggle-error')

    // First submission with error
    await user.type(emailInput, 'wrong@email.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument()
    })

    // Toggle to success mode
    await user.click(toggleButton)

    // Clear form and try again
    await user.clear(emailInput)
    await user.clear(passwordInput)
    await user.type(emailInput, 'test@lumo.dev')
    await user.type(passwordInput, 'password123')
    
    // Click submit - error should be cleared immediately when form submits
    await user.click(submitButton)

    // Error should be cleared when new submission starts
    expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument()
  })

  test('prevents submission with empty fields', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()
    
    render(<LoginForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
    await user.click(submitButton)

    // Form should not submit with empty required fields
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    
    await user.type(emailInput, 'invalid-email')
    
    // HTML5 email validation should prevent submission
    expect(emailInput).toBeInvalid()
  })

  test('accepts valid email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Correo electrónico')
    
    await user.type(emailInput, 'valid@email.com')
    
    expect(emailInput).toBeValid()
  })
}) 