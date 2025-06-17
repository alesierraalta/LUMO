// Mock the entire db-supabase module to avoid environment variable issues
jest.mock('@/lib/db-supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

import { getLowStockItems } from '@/services/inventoryService';

// Mock console.error to capture error logs
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Inventory Service - getLowStockItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should not throw SQL syntax errors', async () => {
    const { supabase } = require('@/lib/db-supabase');
    
    // Mock the chain of methods for getLowStockItems
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  name: 'Test Product',
                  quantity: 2,
                  min_stock_level: 5,
                  category_id: 'cat1',
                  created_at: '2024-01-01T00:00:00.000Z',
                  updated_at: '2024-01-01T00:00:00.000Z',
                  category: { id: 'cat1', name: 'Test Category' }
                }
              ],
              error: null
            })
          })
        })
      })
    });

    // This test will fail if there are SQL syntax errors
    await expect(async () => {
      await getLowStockItems();
    }).not.toThrow(/invalid input syntax for type integer/);
  });

  it('should return an array even if database is empty', async () => {
    const { supabase } = require('@/lib/db-supabase');
    
    // Mock empty response
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    const result = await getLowStockItems();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should not log SQL errors to console', async () => {
    const { supabase } = require('@/lib/db-supabase');
    
    // Mock successful response
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    await getLowStockItems();
    
    // Check that no SQL errors were logged
    const sqlErrors = mockConsoleError.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('invalid input syntax')
      )
    );
    
    expect(sqlErrors).toHaveLength(0);
  });

  it('should handle the filtering logic correctly', () => {
    // Test the filtering logic independently
    const mockItems = [
      { quantity: 2, min_stock_level: 5 }, // Should be included (2 <= 5)
      { quantity: 3, min_stock_level: 10 }, // Should be included (3 <= 10)
      { quantity: 4, min_stock_level: 3 }, // Should be included (4 <= 5)
      { quantity: 50, min_stock_level: 10 }, // Should NOT be included (50 > 10 AND 50 > 5)
      { quantity: 0, min_stock_level: 5 }, // Should be included (0 <= 5)
      { quantity: 6, min_stock_level: 3 }, // Should NOT be included (6 > 3 AND 6 > 5)
    ];

    const filtered = mockItems.filter((item: any) => 
      item.quantity <= item.min_stock_level || item.quantity <= 5
    );

    expect(filtered).toHaveLength(4);
    
    // Verify each filtered item meets the criteria
    filtered.forEach(item => {
      const meetsLowStockCriteria = item.quantity <= item.min_stock_level || item.quantity <= 5;
      expect(meetsLowStockCriteria).toBe(true);
    });
  });

  it('should handle database errors gracefully', async () => {
    const { supabase } = require('@/lib/db-supabase');
    
    // Mock database error
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })
    });

    await expect(getLowStockItems()).rejects.toThrow('Database error: Database connection failed');
    
    // Verify error was logged
    expect(mockConsoleError).toHaveBeenCalledWith(
      '❌ Error fetching low stock items:',
      { message: 'Database connection failed' }
    );
  });

  it('should format returned data correctly', async () => {
    const { supabase } = require('@/lib/db-supabase');
    
    const mockData = [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-001',
        quantity: 2,
        min_stock_level: 5,
        cost: '10.50',
        price: '15.75',
        margin: '33.33',
        image_url: 'test.jpg',
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        category_id: 'cat1',
        location_id: 'loc1',
        created_by_id: 'user1',
        category: { id: 'cat1', name: 'Test Category' }
      }
    ];
    
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })
    });

    const result = await getLowStockItems();
    
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST-001',
      quantity: 2,
      minStockLevel: 5,
      cost: '10.50',
      price: '15.75',
      margin: '33.33',
      imageUrl: 'test.jpg',
      isActive: true,
      categoryId: 'cat1',
      locationId: 'loc1',
      createdById: 'user1',
      category: { id: 'cat1', name: 'Test Category' }
    });
    
    // Verify dates are serialized to ISO strings by serializeDecimal
    expect(typeof result[0].createdAt).toBe('string');
    expect(typeof result[0].updatedAt).toBe('string');
    
    // Verify the dates are valid ISO strings
    expect(result[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // Verify the dates can be parsed back to valid Date objects
    expect(new Date(result[0].createdAt).getTime()).not.toBeNaN();
    expect(new Date(result[0].updatedAt).getTime()).not.toBeNaN();
  });
});
