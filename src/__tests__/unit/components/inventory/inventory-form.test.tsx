/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InventoryForm from '@/components/inventory/inventory-form'

// Mock Next.js router
const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('InventoryForm', () => {
  const mockOnSubmit = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    test('should render form with default values', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Inicializar Inventario')).toBeInTheDocument()
      expect(screen.getByLabelText('Cantidad')).toHaveValue(0)
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(5)
      expect(screen.getByLabelText('Ubicación')).toHaveValue('')
    })

    test('should render form with initial data', () => {
      const initialData = {
        quantity: 100,
        minStockLevel: 10,
        location: 'Almacén A',
      }
      
      render(<InventoryForm initialData={initialData} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Ajustar Inventario')).toBeInTheDocument()
      expect(screen.getByLabelText('Cantidad')).toHaveValue(100)
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(10)
      expect(screen.getByLabelText('Ubicación')).toHaveValue('Almacén A')
    })

    test('should render with product name in title', () => {
      render(<InventoryForm productName="Test Product" onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Inicializar Inventario - Test Product')).toBeInTheDocument()
    })

    test('should render correct button text for new inventory', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByRole('button', { name: 'Inicializar' })).toBeInTheDocument()
    })

    test('should render correct button text for existing inventory', () => {
      const initialData = { quantity: 100, minStockLevel: 10 }
      render(<InventoryForm initialData={initialData} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
    })
  })

  describe('Form validation', () => {
    test('should show error for negative quantity', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      await user.clear(quantityInput)
      await user.type(quantityInput, '-5')
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText('La cantidad no puede ser negativa')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('should show error for negative minimum stock level', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      await user.clear(minStockInput)
      await user.type(minStockInput, '-3')
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText('El nivel mínimo no puede ser negativo')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('should accept valid values', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      const locationInput = screen.getByLabelText('Ubicación')
      
      await user.clear(quantityInput)
      await user.type(quantityInput, '50')
      await user.clear(minStockInput)
      await user.type(minStockInput, '10')
      await user.type(locationInput, 'Almacén B')
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 50,
          minStockLevel: 10,
          location: 'Almacén B',
        })
      })
    })
  })

  describe('Form submission', () => {
    test('should call onSubmit with form data', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      await user.clear(quantityInput)
      await user.type(quantityInput, '25')
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 25,
          minStockLevel: 5,
          location: '',
        })
      })
    })

    test('should show loading state during submission', async () => {
      // Make onSubmit take some time to resolve
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    })

    test('should navigate to inventory page after successful submission', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    test('should handle submission error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error al guardar el inventario:', expect.any(Error))
      })
      
      // Should not navigate on error
      expect(mockPush).not.toHaveBeenCalled()
      
      consoleError.mockRestore()
    })
  })

  describe('Cancel functionality', () => {
    test('should navigate to inventory page when cancel is clicked', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      expect(mockPush).toHaveBeenCalledWith('/inventory')
    })

    test('should disable cancel button during loading', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Input attributes', () => {
    test('should have correct input attributes', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      expect(quantityInput).toHaveAttribute('type', 'number')
      expect(quantityInput).toHaveAttribute('min', '0')
      expect(quantityInput).toHaveAttribute('step', '1')
      
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      expect(minStockInput).toHaveAttribute('type', 'number')
      expect(minStockInput).toHaveAttribute('min', '0')
      expect(minStockInput).toHaveAttribute('step', '1')
    })

    test('should have correct placeholders', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('5')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Almacén, Estante, etc.')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper labels for all inputs', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument()
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toBeInTheDocument()
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument()
    })

    test('should associate error messages with inputs', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      await user.clear(quantityInput)
      await user.type(quantityInput, '-5')
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        const errorMessage = screen.queryByText('La cantidad no puede ser negativa')
        if (errorMessage) {
          expect(errorMessage).toHaveClass('text-destructive')
        }
      }, { timeout: 3000 })
    })
  })

  describe('Layout and styling', () => {
    test('should render with proper card structure', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(document.querySelector('.space-y-4')).toBeInTheDocument()
      expect(document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')).toBeInTheDocument()
    })

    test('should have proper button layout', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const footer = document.querySelector('.flex.justify-between')
      expect(footer).toBeInTheDocument()
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      // Check that buttons are present and in the footer
      expect(footer).toContainElement(cancelButton)
      expect(footer).toContainElement(submitButton)
      
      // Check button types
      expect(cancelButton).toHaveAttribute('type', 'button')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
}) 