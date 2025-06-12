import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import StockMovementForm from '@/components/inventory/stock-movement-form';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the utils functions
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

const defaultProps = {
  productName: 'Test Product',
  currentStock: 50,
  inventoryItemId: 'test-item-id',
  onSubmit: jest.fn(),
};

describe('StockMovementForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe('Basic rendering', () => {
    it('should render the form with all elements', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      expect(screen.getByText('Registrar Movimiento de Stock - Test Product')).toBeInTheDocument();
      expect(screen.getByText('Stock Actual:')).toBeInTheDocument();
      expect(screen.getByText('50 unidades')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Movimiento')).toBeInTheDocument();
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
      expect(screen.getByLabelText('Notas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrar/ })).toBeInTheDocument();
    });

    it('should display current stock correctly', () => {
      render(<StockMovementForm {...defaultProps} currentStock={100} />);
      
      expect(screen.getByText('100 unidades')).toBeInTheDocument();
    });

    it('should render with default form values', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad') as HTMLInputElement;
      expect(quantityInput.value).toBe('1');
      
      const notesTextarea = screen.getByLabelText('Notas') as HTMLTextAreaElement;
      expect(notesTextarea.value).toBe('');
    });
  });

  describe('Form interactions', () => {
    it('should handle quantity input changes', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '25');
      
      expect(quantityInput).toHaveValue(25);
    });

    it('should handle notes input changes', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const notesTextarea = screen.getByLabelText('Notas');
      
      await user.type(notesTextarea, 'Test notes for movement');
      
      expect(notesTextarea).toHaveValue('Test notes for movement');
    });

    it('should display default movement type', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      // Check if default button text shows "Entrada de Stock"
      expect(screen.getByRole('button', { name: /Registrar Entrada de Stock/ })).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show validation error for invalid quantity', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '0');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('La cantidad debe ser mayor que 0')).toBeInTheDocument();
      });
    });

    it('should show validation error for negative quantity', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('La cantidad debe ser mayor que 0')).toBeInTheDocument();
      });
    });

    it('should accept valid positive quantities', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 10,
          type: 'STOCK_IN',
          notes: '',
        });
      });
    });
  });

  describe('Form submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      const notesTextarea = screen.getByLabelText('Notas');
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      
      // Fill form
      await user.clear(quantityInput);
      await user.type(quantityInput, '15');
      await user.type(notesTextarea, 'Test movement notes');
      
      // Submit form
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 15,
          type: 'STOCK_IN',
          notes: 'Test movement notes',
        });
      });
    });

    it('should navigate to inventory page after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error al registrar el movimiento:', expect.any(Error));
      });
      
      // Should not navigate on error
      expect(mockPush).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);
      
      // Should show loading state briefly
      expect(screen.getByText('Procesando...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
      
      // Wait for navigation to complete
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory');
      });
    });
  });

  describe('Cancel button', () => {
    it('should navigate to inventory page when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/inventory');
    });

    it('should disable cancel button during loading', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(<StockMovementForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      
      await user.click(submitButton);
      
      expect(cancelButton).toBeDisabled();
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory');
      });
    });
  });

  describe('Input attributes', () => {
    it('should have correct input attributes', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      expect(quantityInput).toHaveAttribute('type', 'number');
      expect(quantityInput).toHaveAttribute('min', '1');
      expect(quantityInput).toHaveAttribute('step', '1');
      expect(quantityInput).toHaveAttribute('placeholder', '1');
    });

    it('should have correct textarea attributes', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      const notesTextarea = screen.getByLabelText('Notas');
      expect(notesTextarea).toHaveAttribute('placeholder', 'Información adicional sobre este movimiento');
      expect(notesTextarea).toHaveAttribute('rows', '3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
      expect(screen.getByLabelText('Notas')).toBeInTheDocument();
      // Note: Tipo de Movimiento uses Radix UI Select which has complex accessibility structure
      expect(screen.getByText('Tipo de Movimiento')).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Registrar Movimiento de Stock - Test Product');
    });
  });

  describe('Movement type display', () => {
    it('should display movement type selector', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      // Check that the select component is rendered
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // Use getAllByText to handle multiple instances
      expect(screen.getAllByText('Entrada de Stock')).toHaveLength(2);
    });

    it('should show default movement type in button text', () => {
      render(<StockMovementForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Registrar Entrada de Stock/ })).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero current stock', () => {
      render(<StockMovementForm {...defaultProps} currentStock={0} />);
      
      expect(screen.getByText('0 unidades')).toBeInTheDocument();
    });

    it('should handle large current stock numbers', () => {
      render(<StockMovementForm {...defaultProps} currentStock={999999} />);
      
      expect(screen.getByText('999999 unidades')).toBeInTheDocument();
    });

    it('should handle empty product name', () => {
      render(<StockMovementForm {...defaultProps} productName="" />);
      
      // Use a more flexible text matcher for the heading
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Registrar Movimiento de Stock -');
    });

    it('should handle quantity input with non-numeric values gracefully', async () => {
      const user = userEvent.setup();
      render(<StockMovementForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Cantidad');
      
      await user.clear(quantityInput);
      await user.type(quantityInput, 'abc');
      
      // Should not change the value for non-numeric input
      expect(quantityInput).toHaveValue(null);
    });
  });

  describe('Component props validation', () => {
    it('should handle different inventoryItemId formats', () => {
      render(<StockMovementForm {...defaultProps} inventoryItemId="uuid-123-456-789" />);
      
      expect(screen.getByText('Registrar Movimiento de Stock - Test Product')).toBeInTheDocument();
    });

    it('should handle very long product names', () => {
      const longName = 'A'.repeat(50);
      render(<StockMovementForm {...defaultProps} productName={longName} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(`Registrar Movimiento de Stock - ${longName}`);
    });
  });
}); 