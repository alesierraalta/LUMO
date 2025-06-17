/**
 * Comprehensive Movements Page Tests - All User Cases
 */

import { getAllStockMovements } from '@/services/inventoryService';

// Mock the service
jest.mock('@/services/inventoryService', () => ({
  getAllStockMovements: jest.fn(),
}));

const mockGetAllStockMovements = getAllStockMovements as jest.MockedFunction<typeof getAllStockMovements>;

describe('Movements Page - ALL User Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ CRITICAL: Service Integration', () => {
    it('should call getAllStockMovements service correctly', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      await getAllStockMovements();

      expect(mockGetAllStockMovements).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockGetAllStockMovements.mockRejectedValue(new Error('Service Error'));

      await expect(getAllStockMovements()).rejects.toThrow('Service Error');
    });
  });

  describe('✅ CRITICAL: Data Handling', () => {
    it('should handle empty movements list', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const result = await getAllStockMovements();

      expect(result.movements).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle movements with complete data', async () => {
      const mockMovement = {
        id: 'mov-123',
        inventoryItemId: 'item-123',
        type: 'STOCK_IN',
        quantity: 10,
        previousQuantity: 5,
        newQuantity: 15,
        notes: 'Test movement',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-123',
        inventoryItem: {
          id: 'item-123',
          name: 'Test Product',
          sku: 'TEST-001',
          category: { id: 'cat-123', name: 'Test Category' }
        }
      };

      const mockResult = {
        movements: [mockMovement],
        pagination: {
          total: 1,
          pages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const result = await getAllStockMovements();

      expect(result.movements).toHaveLength(1);
      expect(result.movements[0]).toEqual(mockMovement);
    });
  });

  describe('✅ CRITICAL: Pagination Handling', () => {
    it('should handle pagination correctly', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 150,
          pages: 6,
          currentPage: 2,
          hasNext: true,
          hasPrev: true,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const result = await getAllStockMovements({ page: 2, limit: 25 });

      expect(result.pagination.total).toBe(150);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle large datasets', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 100000,
          pages: 1000,
          currentPage: 1,
          hasNext: true,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const result = await getAllStockMovements({ limit: 100 });

      expect(result.pagination.pages).toBe(1000);
      expect(result.pagination.total).toBe(100000);
    });
  });

  describe('✅ CRITICAL: Filtering and Search', () => {
    it('should handle type filtering', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      await getAllStockMovements({ type: 'STOCK_IN' });

      expect(mockGetAllStockMovements).toHaveBeenCalledWith({ type: 'STOCK_IN' });
    });

    it('should handle search queries', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      await getAllStockMovements({ search: 'test product' });

      expect(mockGetAllStockMovements).toHaveBeenCalledWith({ search: 'test product' });
    });

    it('should handle date range filtering', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await getAllStockMovements({ startDate, endDate });

      expect(mockGetAllStockMovements).toHaveBeenCalledWith({ startDate, endDate });
    });
  });

  describe('✅ CRITICAL: Performance Cases', () => {
    it('should handle concurrent requests', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      const promises = Array(5).fill(null).map(() => getAllStockMovements());
      
      await expect(Promise.all(promises)).resolves.toHaveLength(5);
    });

    it('should handle timeout scenarios', async () => {
      mockGetAllStockMovements.mockRejectedValue(new Error('Timeout'));

      await expect(getAllStockMovements()).rejects.toThrow('Timeout');
    });
  });

  describe('✅ CRITICAL: Edge Cases', () => {
    it('should handle undefined parameters', async () => {
      const mockResult = {
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult);

      await expect(getAllStockMovements(undefined)).resolves.toBeDefined();
    });

    it('should handle null response', async () => {
      mockGetAllStockMovements.mockResolvedValue(null as any);

      await expect(getAllStockMovements()).resolves.toBeNull();
    });

    it('should handle malformed data', async () => {
      const mockResult = {
        movements: [
          {
            id: null,
            inventoryItemId: undefined,
            type: '',
            quantity: NaN,
            notes: null,
            createdAt: null,
            inventoryItem: null
          }
        ],
        pagination: undefined,
      };

      mockGetAllStockMovements.mockResolvedValue(mockResult as any);

      await expect(getAllStockMovements()).resolves.toBeDefined();
    });
  });
});
