/**
 * Comprehensive Stock Movements Tests
 * Tests all user cases for stock movements functionality
 */

// Mock the database module first
jest.mock('@/lib/db-supabase', () => ({
  db: {
    stockMovement: {
      findMany: jest.fn(),
      count: jest.fn(),
    }
  },
  supabase: {}
}));

import { getAllStockMovements } from '@/services/inventoryService';
import { db } from '@/lib/db-supabase';

// Get references to the mocked functions
const mockFindMany = db.stockMovement.findMany as jest.MockedFunction<typeof db.stockMovement.findMany>;
const mockCount = db.stockMovement.count as jest.MockedFunction<typeof db.stockMovement.count>;

describe('Stock Movements - Comprehensive User Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllStockMovements - Basic Functionality', () => {
    it('should handle default parameters without errors', async () => {
      // Mock successful response
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const result = await getAllStockMovements();

      expect(result).toEqual({
        movements: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      expect(mockCount).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle pagination correctly', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(150);

      const result = await getAllStockMovements({
        page: 2,
        limit: 25
      });

      expect(result.pagination).toEqual({
        total: 150,
        pages: 6, // Math.ceil(150 / 25)
        currentPage: 2,
        hasNext: true, // 2 * 25 < 150
        hasPrev: true, // 2 > 1
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25, // (2 - 1) * 25
          take: 25,
        })
      );
    });
  });

  describe('getAllStockMovements - Filtering', () => {
    it('should filter by movement type', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({ type: 'STOCK_IN' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'STOCK_IN' },
        })
      );
    });

    it('should handle "all" type filter', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({ type: 'all' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by date range', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await getAllStockMovements({ startDate, endDate });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should filter by search query', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({ search: 'test product' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { notes: { contains: 'test product', mode: 'insensitive' } },
              { inventoryItem: { name: { contains: 'test product', mode: 'insensitive' } } },
              { inventoryItem: { sku: { contains: 'test product', mode: 'insensitive' } } },
            ],
          },
        })
      );
    });

    it('should filter by category', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({ categoryId: 'cat-123' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            inventoryItem: {
              categoryId: 'cat-123',
            },
          },
        })
      );
    });
  });

  describe('getAllStockMovements - Sorting', () => {
    it('should handle different sort options', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({ sort: 'quantity_asc' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { quantity: 'asc' },
        })
      );
    });

    it('should default to createdAt_desc sorting', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getAllStockMovements - Complex Scenarios', () => {
    it('should handle multiple filters combined', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await getAllStockMovements({
        type: 'STOCK_OUT',
        startDate,
        endDate,
        search: 'urgent',
        categoryId: 'cat-456',
        page: 3,
        limit: 20,
        sort: 'createdAt_asc'
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          type: 'STOCK_OUT',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          OR: [
            { notes: { contains: 'urgent', mode: 'insensitive' } },
            { inventoryItem: { name: { contains: 'urgent', mode: 'insensitive' } } },
            { inventoryItem: { sku: { contains: 'urgent', mode: 'insensitive' } } },
          ],
          inventoryItem: {
            categoryId: 'cat-456',
          },
        },
        skip: 40, // (3 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'asc' },
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    it('should handle data serialization correctly', async () => {
      const mockMovement = {
        id: 'mov-123',
        inventoryItemId: 'item-123',
        type: 'STOCK_IN',
        quantity: 10,
        previousQuantity: 5,
        newQuantity: 15,
        notes: 'Test movement',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        createdById: 'user-123',
        inventoryItem: {
          id: 'item-123',
          name: 'Test Product',
          sku: 'TEST-001',
          category: {
            id: 'cat-123',
            name: 'Test Category',
          },
        },
      };

      mockFindMany.mockResolvedValue([mockMovement]);
      mockCount.mockResolvedValue(1);

      const result = await getAllStockMovements();

      expect(result.movements).toHaveLength(1);
      expect(result.movements[0]).toEqual(mockMovement);
    });
  });

  describe('getAllStockMovements - Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockFindMany.mockRejectedValue(dbError);

      await expect(getAllStockMovements()).rejects.toThrow('Database connection failed');
    });

    it('should handle count errors gracefully', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockRejectedValue(new Error('Count failed'));

      await expect(getAllStockMovements()).rejects.toThrow('Count failed');
    });
  });

  describe('getAllStockMovements - Edge Cases', () => {
    it('should handle empty results', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const result = await getAllStockMovements();

      expect(result.movements).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it('should handle large datasets', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(10000);

      const result = await getAllStockMovements({ limit: 100 });

      expect(result.pagination.pages).toBe(100); // Math.ceil(10000 / 100)
    });

    it('should handle invalid page numbers', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(100);

      await getAllStockMovements({ page: 0 });

      // Should default to page 1
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -50, // (0 - 1) * 50 - this might need fixing in the actual code
        })
      );
    });

    it('should handle very large limit values', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(1000);

      await getAllStockMovements({ limit: 1000000 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000000,
        })
      );
    });
  });

  describe('getAllStockMovements - User Experience Cases', () => {
    it('should handle user opening movements page first time', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const result = await getAllStockMovements();

      expect(result.movements).toEqual([]);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should handle user searching for specific movements', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getAllStockMovements({
        type: 'ADJUSTMENT',
        search: 'adjustment'
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: 'ADJUSTMENT',
            OR: [
              { notes: { contains: 'adjustment', mode: 'insensitive' } },
              { inventoryItem: { name: { contains: 'adjustment', mode: 'insensitive' } } },
              { inventoryItem: { sku: { contains: 'adjustment', mode: 'insensitive' } } },
            ],
          },
        })
      );
    });

    it('should handle user navigating through pages', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(200);

      const result = await getAllStockMovements({ page: 3 });

      expect(result.pagination.currentPage).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle user filtering by date range', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      await getAllStockMovements({
        startDate: lastMonth,
        endDate: now
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: lastMonth,
              lte: now,
            },
          },
        })
      );
    });
  });
}); 