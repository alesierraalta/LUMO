/**
 * 🧪 Utils Library Tests
 * 
 * Comprehensive unit tests for utility functions.
 * Tests date formatting, currency formatting, calculations, and data serialization.
 */

import {
  cn,
  getApiBaseUrl,
  ensureValidDate,
  formatDate,
  formatDateTime,
  startOfDay,
  endOfDay,
  formatCurrency,
  serializeDecimal,
  generatePagination,
  calculateMargin,
  calculatePrice,
  formatPercentage,
} from '../utils';

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2'); // Later class should override
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { active: true, disabled: false })).toBe('class1 class2 active');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('', null, undefined)).toBe('');
    });
  });

  describe('getApiBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return NEXT_PUBLIC_API_URL when set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });

    it('should remove trailing slash from NEXT_PUBLIC_API_URL', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });

    it('should return Vercel URL when NEXT_PUBLIC_API_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      process.env.VERCEL_URL = 'myapp.vercel.app';
      expect(getApiBaseUrl()).toBe('https://myapp.vercel.app');
    });

    it('should return localhost in development', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.VERCEL_URL;
      process.env.NODE_ENV = 'development';
      expect(getApiBaseUrl()).toBe('http://localhost:3000');
    });

    it('should return empty string in production without other URLs', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.VERCEL_URL;
      process.env.NODE_ENV = 'production';
      expect(getApiBaseUrl()).toBe('');
    });
  });

  describe('ensureValidDate', () => {
    it('should return Date object as is', () => {
      const date = new Date('2023-01-01');
      expect(ensureValidDate(date)).toBe(date);
    });

    it('should return null for null/undefined inputs', () => {
      expect(ensureValidDate(null)).toBeNull();
      expect(ensureValidDate(undefined)).toBeNull();
    });

    it('should return null for empty objects', () => {
      expect(ensureValidDate({})).toBeNull();
    });

    it('should parse valid date strings', () => {
      const result = ensureValidDate('2023-01-01T00:00:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getUTCFullYear()).toBe(2023);
    });

    it('should return null for invalid date strings', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(ensureValidDate('invalid-date')).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle numeric timestamps', () => {
      const timestamp = Date.now();
      const result = ensureValidDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('should return null for invalid numeric values', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(ensureValidDate(NaN)).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('formatDate', () => {
    it('should format valid dates correctly', () => {
      const date = new Date('2023-01-15T12:00:00.000Z');
      // Use a more flexible matcher since timezone can affect the output
      const result = formatDate(date);
      expect(result).toMatch(/1[45]\/01\/2023/);
    });

    it('should handle string dates', () => {
      const result = formatDate('2023-01-15T12:00:00.000Z');
      expect(result).toMatch(/1[45]\/01\/2023/);
    });

    it('should return fallback for invalid dates', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('invalid')).toBe('-');
    });

    it('should use custom fallback', () => {
      expect(formatDate(null, 'N/A')).toBe('N/A');
    });

    it('should handle formatting errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error');
      });

      expect(formatDate(new Date())).toBe('-');
      
      Intl.DateTimeFormat = originalDateTimeFormat;
      consoleSpy.mockRestore();
    });
  });

  describe('formatDateTime', () => {
    it('should format valid dates with time correctly', () => {
      const date = new Date('2023-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/15\/01\/2023.*14:30/);
    });

    it('should return fallback for invalid dates', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('should use custom fallback', () => {
      expect(formatDateTime(null, 'No date')).toBe('No date');
    });
  });

  describe('startOfDay', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date('2023-01-15T14:30:45.123');
      const result = startOfDay(date);
      
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should not modify the original date', () => {
      const originalDate = new Date('2023-01-15T14:30:45.123');
      const originalTime = originalDate.getTime();
      
      startOfDay(originalDate);
      
      expect(originalDate.getTime()).toBe(originalTime);
    });
  });

  describe('endOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      const date = new Date('2023-01-15T14:30:45.123');
      const result = endOfDay(date);
      
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getDate()).toBe(15);
    });

    it('should not modify the original date', () => {
      const originalDate = new Date('2023-01-15T14:30:45.123');
      const originalTime = originalDate.getTime();
      
      endOfDay(originalDate);
      
      expect(originalDate.getTime()).toBe(originalTime);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as MXN currency', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format string numbers', () => {
      expect(formatCurrency('100')).toBe('$100.00');
      expect(formatCurrency('1234.56')).toBe('$1,234.56');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
    });

    it('should handle invalid strings', () => {
      expect(formatCurrency('invalid')).toBe('$0.00');
      expect(formatCurrency('')).toBe('$0.00');
    });

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency('0')).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });
  });

  describe('serializeDecimal', () => {
    it('should return null/undefined as is', () => {
      expect(serializeDecimal(null)).toBeNull();
      expect(serializeDecimal(undefined)).toBeUndefined();
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-15T14:30:00.000Z');
      expect(serializeDecimal(date)).toBe('2023-01-15T14:30:00.000Z');
    });

    it('should convert Decimal objects to numbers', () => {
      const mockDecimal = {
        toNumber: jest.fn().mockReturnValue(123.45),
      };
      expect(serializeDecimal(mockDecimal)).toBe(123.45);
      expect(mockDecimal.toNumber).toHaveBeenCalled();
    });

    it('should handle arrays recursively', () => {
      const mockDecimal = { toNumber: () => 100 };
      const input = [1, mockDecimal, 'string'];
      const result = serializeDecimal(input);
      
      expect(result).toEqual([1, 100, 'string']);
    });

    it('should handle objects recursively', () => {
      const mockDecimal = { toNumber: () => 50 };
      const input = {
        number: 10,
        decimal: mockDecimal,
        string: 'test',
        nested: {
          decimal: mockDecimal,
        },
      };
      
      const result = serializeDecimal(input);
      
      expect(result).toEqual({
        number: 10,
        decimal: 50,
        string: 'test',
        nested: {
          decimal: 50,
        },
      });
    });

    it('should return primitives as is', () => {
      expect(serializeDecimal(42)).toBe(42);
      expect(serializeDecimal('string')).toBe('string');
      expect(serializeDecimal(true)).toBe(true);
    });
  });

  describe('generatePagination', () => {
    it('should return all pages when total is 7 or less', () => {
      expect(generatePagination(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(generatePagination(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should handle first 3 pages correctly', () => {
      expect(generatePagination(1, 10)).toEqual([1, 2, 3, 4, '...', 9, 10]);
      expect(generatePagination(2, 10)).toEqual([1, 2, 3, 4, '...', 9, 10]);
      expect(generatePagination(3, 10)).toEqual([1, 2, 3, 4, '...', 9, 10]);
    });

    it('should handle last 3 pages correctly', () => {
      expect(generatePagination(8, 10)).toEqual([1, 2, '...', 7, 8, 9, 10]);
      expect(generatePagination(9, 10)).toEqual([1, 2, '...', 7, 8, 9, 10]);
      expect(generatePagination(10, 10)).toEqual([1, 2, '...', 7, 8, 9, 10]);
    });

    it('should handle middle pages correctly', () => {
      expect(generatePagination(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
      expect(generatePagination(6, 15)).toEqual([1, '...', 5, 6, 7, '...', 15]);
    });

    it('should handle edge cases', () => {
      expect(generatePagination(1, 1)).toEqual([1]);
      expect(generatePagination(1, 2)).toEqual([1, 2]);
    });
  });

  describe('calculateMargin', () => {
    it('should calculate margin correctly', () => {
      expect(calculateMargin(100, 150)).toBe(50); // 50% margin
      expect(calculateMargin(50, 75)).toBe(50); // 50% margin
    });

    it('should handle zero cost', () => {
      expect(calculateMargin(0, 100)).toBe(0);
    });

    it('should handle negative cost', () => {
      expect(calculateMargin(-10, 100)).toBe(0);
    });

    it('should handle zero price', () => {
      expect(calculateMargin(100, 0)).toBe(0);
    });

    it('should handle negative price', () => {
      expect(calculateMargin(100, -50)).toBe(0);
    });

    it('should handle string inputs', () => {
      expect(calculateMargin('100' as any, '150' as any)).toBe(50);
    });

    it('should handle invalid inputs', () => {
      expect(calculateMargin(NaN, 100)).toBe(0);
      expect(calculateMargin(100, NaN)).toBe(0);
    });

    it('should calculate negative margins', () => {
      expect(calculateMargin(100, 80)).toBe(-20); // 20% loss
    });

    it('should handle decimal values', () => {
      expect(calculateMargin(33.33, 50)).toBeCloseTo(50, 1);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price correctly', () => {
      expect(calculatePrice(100, 50)).toBe(150); // 50% margin
      expect(calculatePrice(50, 100)).toBe(100); // 100% margin
    });

    it('should handle zero cost', () => {
      expect(calculatePrice(0, 50)).toBe(0);
    });

    it('should handle negative cost', () => {
      expect(calculatePrice(-10, 50)).toBe(0);
    });

    it('should handle zero margin', () => {
      expect(calculatePrice(100, 0)).toBe(100);
    });

    it('should handle negative margin', () => {
      expect(calculatePrice(100, -10)).toBe(100);
    });

    it('should handle string inputs', () => {
      expect(calculatePrice('100' as any, '50' as any)).toBe(150);
    });

    it('should handle invalid inputs', () => {
      expect(calculatePrice(NaN, 50)).toBe(0);
      expect(calculatePrice(100, NaN)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(calculatePrice(33.33, 50)).toBeCloseTo(49.995, 2);
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentages', () => {
      expect(formatPercentage(25.5)).toBe('25.50%');
      expect(formatPercentage(100)).toBe('100.00%');
    });

    it('should format negative percentages', () => {
      expect(formatPercentage(-25.5)).toBe('25.50%');
      expect(formatPercentage(-100)).toBe('100.00%');
    });

    it('should show sign when requested', () => {
      expect(formatPercentage(25.5, true)).toBe('+25.50%');
      expect(formatPercentage(-25.5, true)).toBe('25.50%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(0, true)).toBe('0.00%');
    });

    it('should format decimal places correctly', () => {
      expect(formatPercentage(25.123)).toBe('25.12%');
      expect(formatPercentage(25.999)).toBe('26.00%');
    });

    it('should handle very small numbers', () => {
      expect(formatPercentage(0.001)).toBe('0.00%');
      expect(formatPercentage(0.01)).toBe('0.01%');
    });

    it('should handle very large numbers', () => {
      expect(formatPercentage(1000)).toBe('1000.00%');
      expect(formatPercentage(999999.99)).toBe('999999.99%');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle console.error calls gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test functions that might call console.error
      ensureValidDate('invalid-date');
      formatDate('invalid-date');
      formatDateTime('invalid-date');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle extreme date values', () => {
      const veryOldDate = new Date('1900-01-01T12:00:00.000Z');
      const veryNewDate = new Date('2100-12-31T12:00:00.000Z');
      
      // Use flexible matchers for timezone differences
      expect(formatDate(veryOldDate)).toMatch(/0[12]\/01\/1900/);
      expect(formatDate(veryNewDate)).toMatch(/3[01]\/12\/2100/);
    });

    it('should handle very large currency values', () => {
      expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
    });

    it('should handle very small currency values', () => {
      expect(formatCurrency(0.001)).toBe('$0.00');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });
  });
}); 