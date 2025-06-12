/**
 * 🧪 InventoryForm Component Tests
 * 
 * Comprehensive unit tests for inventory management form.
 * Tests form validation, submission handling, loading states, and user interactions.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/utils/test-utils';
import InventoryForm from '../inventory-form';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('InventoryForm', () => {
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render form with default values for new inventory', () => {
      render(<InventoryForm {...defaultProps} />);

      expect(screen.getByText('Inicializar Inventario')).toBeInTheDocument();
      expect(screen.getByLabelText('Cantidad')).toHaveValue(0);
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(5);
      expect(screen.getByLabelText('Ubicación')).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inicializar' })).toBeInTheDocument();
    });

    it('should render form with initial data for existing inventory', () => {
      const initialData = {
        quantity: 100,
        minStockLevel: 10,
        location: 'Almacén A',
      };

      render(
        <InventoryForm 
          {...defaultProps} 
          initialData={initialData}
          productName="Test Product"
        />
      );

      expect(screen.getByText('Ajustar Inventario - Test Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Cantidad')).toHaveValue(100);
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(10);
      expect(screen.getByLabelText('Ubicación')).toHaveValue('Almacén A');
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    });

    it('should show product name in title when provided', () => {
      render(
        <InventoryForm 
          {...defaultProps} 
          productName="Test Product Name"
        />
      );

      expect(screen.getByText('Inicializar Inventario - Test Product Name')).toBeInTheDocument();
    });

    it('should have proper form structure and accessibility', () => {
      render(<InventoryForm {...defaultProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate quantity is not negative', async () => {
      const user = userEvent.setup();
      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La cantidad no puede ser negativa')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate minStockLevel is not negative', async () => {
      const user = userEvent.setup();
      render(<InventoryForm {...defaultProps} />);

      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');
      await user.clear(minStockInput);
      await user.type(minStockInput, '-10');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El nivel mínimo no puede ser negativo')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept zero values for quantity and minStockLevel', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');

      await user.clear(quantityInput);
      await user.type(quantityInput, '0');
      await user.clear(minStockInput);
      await user.type(minStockInput, '0');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 0,
          minStockLevel: 0,
          location: '',
        });
      });
    });

    it('should convert string numbers to integers', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');

      await user.clear(quantityInput);
      await user.type(quantityInput, '25.7'); // Should be converted to 25
      await user.clear(minStockInput);
      await user.type(minStockInput, '10.9'); // Should be converted to 10

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 25,
          minStockLevel: 10,
          location: '',
        });
      });
    });

    it('should handle empty location field', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 0,
          minStockLevel: 5,
          location: '',
        });
      });
    });
  });

  describe('Form Interaction', () => {
    it('should allow user to input values in all fields', async () => {
      const user = userEvent.setup();
      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');
      const locationInput = screen.getByLabelText('Ubicación');

      await user.clear(quantityInput);
      await user.type(quantityInput, '150');
      await user.clear(minStockInput);
      await user.type(minStockInput, '20');
      await user.type(locationInput, 'Almacén Principal');

      expect(quantityInput).toHaveValue(150);
      expect(minStockInput).toHaveValue(20);
      expect(locationInput).toHaveValue('Almacén Principal');
    });

    it('should handle cancel button click', async () => {
      const user = userEvent.setup();
      render(<InventoryForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/inventory');
    });

    it('should disable form elements during loading', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      mockOnSubmit.mockImplementation(() => 
        new Promise(resolve => { resolveSubmit = () => resolve(undefined); })
      );

      render(<InventoryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();

      // Resolve the promise
      resolveSubmit!();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');
      const locationInput = screen.getByLabelText('Ubicación');

      await user.clear(quantityInput);
      await user.type(quantityInput, '75');
      await user.clear(minStockInput);
      await user.type(minStockInput, '15');
      await user.type(locationInput, 'Estante B-2');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 75,
          minStockLevel: 15,
          location: 'Estante B-2',
        });
      });
    });

    it('should redirect to inventory page on successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/inventory');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      render(<InventoryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error al guardar el inventario:',
          expect.any(Error)
        );
      });

      // Form should be enabled again after error
      expect(screen.getByRole('button', { name: 'Inicializar' })).not.toBeDisabled();

      consoleErrorSpy.mockRestore();
    });

    it('should not redirect on submission error', async () => {
      const user = userEvent.setup();
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      render(<InventoryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Inicializar' })).not.toBeDisabled();
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Different Form Modes', () => {
    it('should show correct button text for new inventory', () => {
      render(<InventoryForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Inicializar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Actualizar' })).not.toBeInTheDocument();
    });

    it('should show correct button text for existing inventory', () => {
      const initialData = { quantity: 50, minStockLevel: 10, location: 'Test' };
      render(<InventoryForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Inicializar' })).not.toBeInTheDocument();
    });

    it('should show correct title for new inventory', () => {
      render(<InventoryForm {...defaultProps} />);

      expect(screen.getByText('Inicializar Inventario')).toBeInTheDocument();
      expect(screen.queryByText(/Ajustar Inventario/)).not.toBeInTheDocument();
    });

    it('should show correct title for existing inventory', () => {
      const initialData = { quantity: 50, minStockLevel: 10, location: 'Test' };
      render(<InventoryForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByText('Ajustar Inventario')).toBeInTheDocument();
      expect(screen.queryByText('Inicializar Inventario')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      await user.clear(quantityInput);
      await user.type(quantityInput, '999999');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 999999,
          minStockLevel: 5,
          location: '',
        });
      });
    });

    it('should handle special characters in location field', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<InventoryForm {...defaultProps} />);

      const locationInput = screen.getByLabelText('Ubicación');
      await user.type(locationInput, 'Almacén #1 - Sección A/B (Nivel 2)');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quantity: 0,
          minStockLevel: 5,
          location: 'Almacén #1 - Sección A/B (Nivel 2)',
        });
      });
    });

    it('should handle undefined initial data gracefully', () => {
      render(<InventoryForm {...defaultProps} initialData={undefined} />);

      expect(screen.getByLabelText('Cantidad')).toHaveValue(0);
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(5);
      expect(screen.getByLabelText('Ubicación')).toHaveValue('');
    });

    it('should handle partial initial data', () => {
      const partialData = { quantity: 25 }; // Missing minStockLevel and location
      render(<InventoryForm {...defaultProps} initialData={partialData} />);

      expect(screen.getByLabelText('Cantidad')).toHaveValue(25);
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toHaveValue(5); // Default value
      expect(screen.getByLabelText('Ubicación')).toHaveValue(''); // Default value
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      render(<InventoryForm {...defaultProps} />);

      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
      expect(screen.getByLabelText('Nivel Mínimo de Stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
    });

    it('should show validation errors with proper accessibility', async () => {
      const user = userEvent.setup();
      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');

      const submitButton = screen.getByRole('button', { name: 'Inicializar' });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('La cantidad no puede ser negativa');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-destructive');
      });
    });

    it('should have proper input types and attributes', () => {
      render(<InventoryForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText('Cantidad');
      const minStockInput = screen.getByLabelText('Nivel Mínimo de Stock');

      expect(quantityInput).toHaveAttribute('type', 'number');
      expect(quantityInput).toHaveAttribute('min', '0');
      expect(quantityInput).toHaveAttribute('step', '1');

      expect(minStockInput).toHaveAttribute('type', 'number');
      expect(minStockInput).toHaveAttribute('min', '0');
      expect(minStockInput).toHaveAttribute('step', '1');
    });
  });
}); 