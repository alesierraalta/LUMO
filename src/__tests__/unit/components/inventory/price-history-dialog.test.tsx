import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceHistoryDialog from '@/components/inventory/price-history-dialog';

// Mock the utils functions
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
  formatCurrency: jest.fn((value) => `$${value?.toFixed(2) || '0.00'}`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockHistoryData = [
  {
    id: '1',
    createdAt: '2024-01-15T10:00:00Z',
    oldPrice: 100,
    newPrice: 120,
    oldCost: 80,
    newCost: 90,
    oldMargin: 20,
    newMargin: 25,
    changeReason: 'Price increase due to supplier cost',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  },
  {
    id: '2',
    createdAt: '2024-01-10T15:30:00Z',
    oldPrice: null,
    newPrice: 100,
    oldCost: null,
    newCost: 80,
    oldMargin: null,
    newMargin: 20,
    changeReason: 'Initial price setting',
    user: null,
  },
  {
    id: '3',
    createdAt: '2024-01-05T09:15:00Z',
    oldPrice: 120,
    newPrice: 110,
    oldCost: 90,
    newCost: 85,
    oldMargin: 25,
    newMargin: 22.7,
    changeReason: 'Promotional discount',
    user: {
      firstName: null,
      lastName: null,
      email: 'admin@example.com',
    },
  },
];

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  inventoryItemId: 'item-123',
  itemName: 'Test Product',
};

describe('PriceHistoryDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic rendering', () => {
    it('should render dialog when open', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      expect(screen.getByText('Historial de Precios y Costos')).toBeInTheDocument();
      expect(screen.getByText(/Historial de cambios de precio y costo para:/)).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<PriceHistoryDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Historial de Precios y Costos')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => [] }), 100))
      );

      render(<PriceHistoryDialog {...defaultProps} />);
      
      expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
    });
  });

  describe('Data fetching', () => {
    it('should fetch history when dialog opens', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryData,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/inventory/item-123/price-history');
      });
    });

    it('should not fetch when dialog is closed', () => {
      render(<PriceHistoryDialog {...defaultProps} open={false} />);
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not fetch when inventoryItemId is empty', () => {
      render(<PriceHistoryDialog {...defaultProps} inventoryItemId="" />);
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should refetch when inventoryItemId changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { rerender } = render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/inventory/item-123/price-history');
      });

      rerender(<PriceHistoryDialog {...defaultProps} inventoryItemId="item-456" />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/inventory/item-456/price-history');
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No se pudo cargar el historial de precios')).toBeInTheDocument();
      });
    });

    it('should display error message when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No se pudo cargar el historial de precios')).toBeInTheDocument();
      });
    });

    it('should log error to console when fetch fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching price history:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Empty state', () => {
    it('should display empty message when no history data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No hay historial de cambios de precio o costo.')).toBeInTheDocument();
      });
    });
  });

  describe('History table', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryData,
      });
    });

    it('should display table headers', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Fecha')).toBeInTheDocument();
        expect(screen.getByText('Precio Anterior')).toBeInTheDocument();
        expect(screen.getByText('Precio Nuevo')).toBeInTheDocument();
        expect(screen.getByText('Costo Anterior')).toBeInTheDocument();
        expect(screen.getByText('Costo Nuevo')).toBeInTheDocument();
        expect(screen.getByText('Margen Anterior')).toBeInTheDocument();
        expect(screen.getByText('Margen Nuevo')).toBeInTheDocument();
        expect(screen.getByText('Razón')).toBeInTheDocument();
        expect(screen.getByText('Usuario')).toBeInTheDocument();
      });
    });

    it('should display history records with formatted values', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('$100.00')).toHaveLength(2); // Old price and new price in different records
        expect(screen.getAllByText('$120.00')).toHaveLength(2); // Old price and new price in different records
        expect(screen.getAllByText('$80.00')).toHaveLength(2); // Old cost and new cost in different records
        expect(screen.getAllByText('$90.00')).toHaveLength(2); // Old cost and new cost in different records
        expect(screen.getAllByText('20%')).toHaveLength(2); // Old margin and new margin in different records
        expect(screen.getAllByText('25%')).toHaveLength(2); // Old margin and new margin in different records
        expect(screen.getByText('Price increase due to supplier cost')).toBeInTheDocument();
      });
    });

    it('should display user information correctly', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getAllByText('admin@example.com')).toHaveLength(2); // Name and email for user with no first/last name
        expect(screen.getByText('Sistema')).toBeInTheDocument();
      });
    });

    it('should display dash for null values', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const dashElements = screen.getAllByText('-');
        expect(dashElements.length).toBeGreaterThan(0);
      });
    });

    it('should display change reason with title attribute for truncation', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const reasonCell = screen.getByText('Price increase due to supplier cost');
        expect(reasonCell).toHaveAttribute('title', 'Price increase due to supplier cost');
      });
    });
  });

  describe('Change indicators', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryData,
      });
    });

    it('should show up arrow for price increases', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const upArrows = document.querySelectorAll('.lucide-arrow-up');
        expect(upArrows.length).toBeGreaterThan(0);
      });
    });

    it('should show down arrow for price decreases', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const downArrows = document.querySelectorAll('.lucide-arrow-down');
        expect(downArrows.length).toBeGreaterThan(0);
      });
    });

    it('should show minus icon for null values', async () => {
      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const minusIcons = document.querySelectorAll('.lucide-minus');
        expect(minusIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dialog interactions', () => {
    it('should call onOpenChange when close button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      const closeButton = screen.getByText('Cerrar');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when dialog overlay is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      // Simulate clicking outside the dialog
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onOpenChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    });

    it('should have proper table structure when data is loaded', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryData,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(9);
        expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle user with only email', async () => {
      const dataWithEmailOnly = [{
        ...mockHistoryData[0],
        user: {
          firstName: null,
          lastName: null,
          email: 'user@example.com',
        },
      }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithEmailOnly,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('user@example.com')).toHaveLength(2); // Name and email for user with only email
      });
    });

    it('should handle empty change reason', async () => {
      const dataWithEmptyReason = [{
        ...mockHistoryData[0],
        changeReason: null,
      }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithEmptyReason,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const dashElements = screen.getAllByText('-');
        expect(dashElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle equal old and new values', async () => {
      const dataWithEqualValues = [{
        ...mockHistoryData[0],
        oldPrice: 100,
        newPrice: 100,
      }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithEqualValues,
      });

      render(<PriceHistoryDialog {...defaultProps} />);
      
      await waitFor(() => {
        const minusIcons = document.querySelectorAll('.lucide-minus');
        expect(minusIcons.length).toBeGreaterThan(0);
      });
    });
  });
}); 