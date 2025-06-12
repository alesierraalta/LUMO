/**
 * @jest-environment jsdom
 */

import React from 'react';
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
    mockOnSubmit.mockClear()
    mockPush.mockClear()
    mockRefresh.mockClear()
  })

  describe('Basic rendering', () => {
    test('should render form with default values', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Inicializar Inventario')).toBeInTheDocument()
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument()
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toBeInTheDocument()
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Inicializar' })).toBeInTheDocument()
    })

    test('should render form with initial data', () => {
      const initialData = {
        quantity: 50,
        minStockLevel: 10,
        location: 'Warehouse A',
      }
      
      render(<InventoryForm initialData={initialData} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Ajustar Inventario')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Warehouse A')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
    })

    test('should render form with product name', () => {
      const productName = 'Test Product'
      render(<InventoryForm productName={productName} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText(`Inicializar Inventario - ${productName}`)).toBeInTheDocument()
    })
  })

  describe('Form inputs', () => {
    test('should handle quantity input changes', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      await user.clear(quantityInput)
      await user.type(quantityInput, '100')
      
      expect(quantityInput).toHaveValue(100)
    })

    test('should handle minStockLevel input changes', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      await user.clear(minStockInput)
      await user.type(minStockInput, '15')
      
      expect(minStockInput).toHaveValue(15)
    })

    test('should handle location input changes', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const locationInput = screen.getByLabelText('Ubicación')
      await user.type(locationInput, 'Storage Room B')
      
      expect(locationInput).toHaveValue('Storage Room B')
    })
  })

  describe('Form validation', () => {
    test('should prevent submission with negative quantity', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      await user.clear(quantityInput)
      await user.type(quantityInput, '-5')
      await user.click(submitButton)
      
      // Form should not submit with invalid data
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    test('should prevent submission with negative minStockLevel', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      await user.clear(minStockInput)
      await user.type(minStockInput, '-3')
      await user.click(submitButton)
      
      // Form should not submit with invalid data
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    test('should accept zero values', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      await user.clear(quantityInput)
      await user.type(quantityInput, '0')
      await user.clear(minStockInput)
      await user.type(minStockInput, '0')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 0,
          minStockLevel: 0,
          location: '',
        })
      })
    })
  })

  describe('Form submission', () => {
    test('should submit form with valid data', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      const locationInput = screen.getByLabelText('Ubicación')
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      await user.clear(quantityInput)
      await user.type(quantityInput, '25')
      await user.clear(minStockInput)
      await user.type(minStockInput, '5')
      await user.type(locationInput, 'Main Storage')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 25,
          minStockLevel: 5,
          location: 'Main Storage',
        })
      })
    })

    test('should navigate to inventory page after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    test('should handle submission errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error al guardar el inventario:',
          expect.any(Error)
        )
      })
      
      consoleErrorSpy.mockRestore()
    })

    test('should show loading state during submission', async () => {
      let resolveSubmit: (value?: any) => void
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
      
      // Resolve the promise
      resolveSubmit!()
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory')
      })
    })
  })

  describe('Cancel button', () => {
    test('should navigate to inventory page when cancel is clicked', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      expect(mockPush).toHaveBeenCalledWith('/inventory')
    })

    test('should disable cancel button during loading', async () => {
      let resolveSubmit: (value?: any) => void
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)
      
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      await user.click(submitButton)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      expect(cancelButton).toBeDisabled()
      
      resolveSubmit!()
    })
  })

  describe('Input attributes', () => {
    test('should have correct input attributes', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      
      expect(quantityInput).toHaveAttribute('type', 'number')
      expect(quantityInput).toHaveAttribute('min', '0')
      expect(quantityInput).toHaveAttribute('step', '1')
      expect(quantityInput).toHaveAttribute('placeholder', '0')
      
      expect(minStockInput).toHaveAttribute('type', 'number')
      expect(minStockInput).toHaveAttribute('min', '0')
      expect(minStockInput).toHaveAttribute('step', '1')
      expect(minStockInput).toHaveAttribute('placeholder', '5')
    })

    test('should have correct location input attributes', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const locationInput = screen.getByLabelText('Ubicación')
      expect(locationInput).toHaveAttribute('placeholder', 'Almacén, Estante, etc.')
    })
  })

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument()
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toBeInTheDocument()
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument()
    })

    test('should have proper form structure', async () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const submitButton = screen.getByRole('button', { name: 'Inicializar' })
      
      // Test that form elements are properly structured
      expect(quantityInput).toBeInTheDocument()
      expect(submitButton).toBeInTheDocument()
      expect(quantityInput.closest('form')).toBeInTheDocument()
    })

    test('should have proper heading structure', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByRole('heading', { name: 'Inicializar Inventario' })).toBeInTheDocument()
    })
  })

  describe('Default values', () => {
    test('should use default values when no initial data provided', () => {
      render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const quantityInput = screen.getByLabelText('Cantidad')
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock')
      const locationInput = screen.getByLabelText('Ubicación')
      
      expect(quantityInput).toHaveValue(0)
      expect(minStockInput).toHaveValue(5)
      expect(locationInput).toHaveValue('')
    })
  })

  describe('Form layout', () => {
    test('should have proper grid layout for inputs', () => {
      const { container } = render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })

    test('should have proper button layout', () => {
      const { container } = render(<InventoryForm onSubmit={mockOnSubmit} />)
      
      const buttonContainer = container.querySelector('.flex.justify-between')
      expect(buttonContainer).toBeInTheDocument()
    })
  })
}) 