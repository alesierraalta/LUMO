/**
 * COMPREHENSIVE UNIT TESTS FOR ENHANCED CATEGORY DELETE ERROR HANDLING
 * 
 * This test suite specifically validates the enhanced error handling and timeout protection
 * that was implemented to fix the category deletion 500 errors in production.
 * 
 * Tests cover:
 * - Authentication timeout scenarios
 * - Database operation timeouts
 * - Delete operation timeouts
 * - Enhanced error response codes and messages
 * - Edge cases and error boundaries
 */

// Jest globals are available through jest.setup.js configuration
// Mock Next.js Request and Response for Node.js environment
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
  }
};

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
};

// Mock dependencies
jest.mock('@/lib/db-supabase', () => ({
  db: {
    category: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-server', () => ({
  getCurrentUser: jest.fn(),
  getTokenFromRequest: jest.fn(),
  getCurrentUserFromToken: jest.fn(),
}));

// Import after mocking
import { DELETE } from '@/app/api/categories/[id]/route';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

describe('Categories DELETE API - Enhanced Error Handling', () => {
  let mockRequest: NextRequest;
  let mockParams: { params: Promise<{ id: string }> };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock request
    mockRequest = new NextRequest('http://localhost:3000/api/categories/test-id', {
      method: 'DELETE',
    });
    
    mockParams = {
      params: Promise.resolve({ id: 'test-category-id' })
    };
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication Timeout Protection', () => {
    it('should handle authentication timeout with token', async () => {
      // Mock token extraction
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      
      // Mock authentication timeout
      (getCurrentUserFromToken as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 100)
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication service timeout. Please try again.');
    });

    it('should handle authentication timeout without token', async () => {
      // Mock no token
      (getTokenFromRequest as jest.Mock).mockReturnValue(null);
      
      // Mock authentication timeout
      (getCurrentUser as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 100)
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication service timeout. Please try again.');
    });

    it('should handle general authentication errors as 500', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication service error. Please try again.');
    });

    it('should return 401 for missing authentication without errors', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue(null);
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('2. Database Query Timeout Protection', () => {
    it('should handle database timeout during category lookup', async () => {
      // Mock successful authentication
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      // Mock database timeout
      (db.category.findUnique as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 100)
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database timeout. Please try again.');
    });

    it('should handle other database errors during lookup', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      // Mock database error (not timeout)
      (db.category.findUnique as jest.Mock).mockRejectedValue(new Error('Connection lost'));

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to delete category');
    });
  });

  describe('3. Category Not Found Scenarios', () => {
    it('should return 404 for non-existent category', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      (db.category.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Category not found');
    });
  });

  describe('4. Category with Associated Products', () => {
    it('should return 400 for category with associated products', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      // Mock category with associated products
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 5 }
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot delete category with 5 associated products. Please reassign or delete the products first.');
    });

    it('should handle missing _count gracefully', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      // Mock category without _count
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category'
      });

      // Mock successful deletion
      (db.category.delete as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category'
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Category deleted successfully');
    });
  });

  describe('5. Delete Operation Timeout Protection', () => {
    it('should handle delete operation timeout', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      // Mock category without products
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      // Mock delete timeout
      (db.category.delete as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Delete timeout')), 100)
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Delete operation timeout. Please try again.');
    });

    it('should handle other delete operation errors', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      // Mock delete error (not timeout)
      (db.category.delete as jest.Mock).mockRejectedValue(new Error('Database connection lost'));

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to delete category');
    });
  });

  describe('6. Successful Deletion Scenarios', () => {
    it('should successfully delete category without products', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category'
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Category deleted successfully');
    });

    it('should work with session-based authentication', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue(null);
      (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category'
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Category deleted successfully');
    });
  });

  describe('7. Enhanced Error Response Handling', () => {
    it('should handle "Record to delete does not exist" error', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete does not exist')
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete category: Category not found or already deleted');
    });

    it('should handle foreign key constraint errors', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete category: Cannot delete category with associated products');
    });

    it('should handle timeout errors in final catch block', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockRejectedValue(
        new Error('Operation timeout occurred')
      );

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete category: Operation timeout. Please try again.');
    });
  });

  describe('8. Edge Cases and Error Boundaries', () => {
    it('should handle undefined error messages', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      // Mock error without message
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      (db.category.delete as jest.Mock).mockRejectedValue(errorWithoutMessage);

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete category: Unknown error occurred');
    });

    it('should handle malformed params', async () => {
      const malformedParams = {
        params: Promise.resolve({ id: '' })
      };

      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      (db.category.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, malformedParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Category not found');
    });

    it('should log comprehensive error details', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      const testError = new Error('Test error');
      testError.stack = 'Test stack trace';
      (db.category.delete as jest.Mock).mockRejectedValue(testError);

      await DELETE(mockRequest, mockParams);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error deleting category:', testError);
      expect(consoleSpy).toHaveBeenCalledWith('Error details:', {
        message: 'Test error',
        stack: 'Test stack trace',
        name: 'Error',
        cause: undefined
      });
    });
  });

  describe('9. Performance and Timeout Validation', () => {
    it('should respect authentication timeout of 5 seconds', async () => {
      const startTime = Date.now();
      
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 6000) // Longer than 5s timeout
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const endTime = Date.now();
      
      // Should timeout before 6 seconds
      expect(endTime - startTime).toBeLessThan(6000);
      expect(response.status).toBe(500);
    });

    it('should respect database timeout of 10 seconds', async () => {
      const startTime = Date.now();
      
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 11000) // Longer than 10s timeout
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const endTime = Date.now();
      
      // Should timeout before 11 seconds
      expect(endTime - startTime).toBeLessThan(11000);
      expect(response.status).toBe(500);
    });

    it('should respect delete timeout of 10 seconds', async () => {
      const startTime = Date.now();
      
      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (getCurrentUserFromToken as jest.Mock).mockResolvedValue({ id: 'user-id' });
      
      (db.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-category-id',
        name: 'Test Category',
        _count: { inventoryItems: 0 }
      });
      
      (db.category.delete as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Delete timeout')), 11000) // Longer than 10s timeout
        )
      );

      const response = await DELETE(mockRequest, mockParams);
      const endTime = Date.now();
      
      // Should timeout before 11 seconds
      expect(endTime - startTime).toBeLessThan(11000);
      expect(response.status).toBe(500);
    });
  });
});