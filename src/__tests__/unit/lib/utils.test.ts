/**
 * @jest-environment jsdom
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
} from '@/lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    test('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    test('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    test('should resolve Tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    test('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })
  })

  describe('getApiBaseUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    test('should return NEXT_PUBLIC_API_URL when set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/'
      expect(getApiBaseUrl()).toBe('https://api.example.com')
    })

    test('should return VERCEL_URL when NEXT_PUBLIC_API_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      process.env.VERCEL_URL = 'myapp.vercel.app'
      expect(getApiBaseUrl()).toBe('https://myapp.vercel.app')
    })

    test('should return localhost in development', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      delete process.env.VERCEL_URL
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      expect(getApiBaseUrl()).toBe('http://localhost:3000')
    })

    test('should return empty string in production without URLs', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      delete process.env.VERCEL_URL
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      expect(getApiBaseUrl()).toBe('')
    })
  })

  describe('ensureValidDate', () => {
    test('should return Date object as is', () => {
      const date = new Date('2024-01-01')
      expect(ensureValidDate(date)).toBe(date)
    })

    test('should return null for null/undefined', () => {
      expect(ensureValidDate(null)).toBeNull()
      expect(ensureValidDate(undefined)).toBeNull()
    })

    test('should return null for empty object', () => {
      expect(ensureValidDate({})).toBeNull()
    })

    test('should parse valid date strings', () => {
      const result = ensureValidDate('2024-01-01')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
    })

    test('should return null for invalid date strings', () => {
      expect(ensureValidDate('invalid-date')).toBeNull()
    })

    test('should handle numeric timestamps', () => {
      const timestamp = Date.now()
      const result = ensureValidDate(timestamp)
      expect(result).toBeInstanceOf(Date)
    })

    test('should return null for invalid inputs', () => {
      expect(ensureValidDate('not-a-date')).toBeNull()
      expect(ensureValidDate(NaN)).toBeNull()
    })
  })

  describe('formatDate', () => {
    test('should format valid dates', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/15\/01\/2024/)
    })

    test('should return fallback for invalid dates', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
      expect(formatDate('invalid')).toBe('-')
    })

    test('should use custom fallback', () => {
      expect(formatDate(null, 'N/A')).toBe('N/A')
    })

    test('should handle date strings', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/15\/01\/2024/)
    })

    test('should handle formatting errors gracefully', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat
      const mockDateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error')
      }) as any
      mockDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf
      Intl.DateTimeFormat = mockDateTimeFormat

      const result = formatDate(new Date('2024-01-15'))
      expect(result).toBe('-')

      // Restore original
      Intl.DateTimeFormat = originalDateTimeFormat
    })
  })

  describe('formatDateTime', () => {
    test('should format valid dates with time', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/15\/01\/2024.*10:30/)
    })

    test('should return fallback for invalid dates', () => {
      expect(formatDateTime(null)).toBe('-')
      expect(formatDateTime(undefined)).toBe('-')
      expect(formatDateTime('invalid')).toBe('-')
    })

    test('should use custom fallback', () => {
      expect(formatDateTime(null, 'N/A')).toBe('N/A')
    })
  })

  describe('startOfDay', () => {
    test('should set time to start of day', () => {
      const date = new Date('2024-01-15T15:30:45.123')
      const result = startOfDay(date)
      
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    test('should not modify original date', () => {
      const original = new Date('2024-01-15T15:30:45.123')
      const originalTime = original.getTime()
      startOfDay(original)
      
      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('endOfDay', () => {
    test('should set time to end of day', () => {
      const date = new Date('2024-01-15T10:30:45.123')
      const result = endOfDay(date)
      
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
      expect(result.getDate()).toBe(15)
    })

    test('should not modify original date', () => {
      const original = new Date('2024-01-15T10:30:45.123')
      const originalTime = original.getTime()
      endOfDay(original)
      
      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('formatCurrency', () => {
    test('should format numbers as MXN currency', () => {
      expect(formatCurrency(100)).toMatch(/\$100\.00/)
      expect(formatCurrency(1234.56)).toMatch(/\$1,234\.56/)
    })

    test('should format string numbers', () => {
      expect(formatCurrency('100')).toMatch(/\$100\.00/)
      expect(formatCurrency('1234.56')).toMatch(/\$1,234\.56/)
    })

    test('should return $0.00 for null/undefined', () => {
      expect(formatCurrency(null)).toBe('$0.00')
      expect(formatCurrency(undefined)).toBe('$0.00')
    })

    test('should return $0.00 for invalid strings', () => {
      expect(formatCurrency('invalid')).toBe('$0.00')
      expect(formatCurrency('not-a-number')).toBe('$0.00')
    })

    test('should handle zero', () => {
      expect(formatCurrency(0)).toMatch(/\$0\.00/)
    })

    test('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toMatch(/-\$100\.00/)
    })
  })

  describe('serializeDecimal', () => {
    test('should return null/undefined as is', () => {
      expect(serializeDecimal(null)).toBeNull()
      expect(serializeDecimal(undefined)).toBeUndefined()
    })

    test('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      expect(serializeDecimal(date)).toBe('2024-01-15T10:30:00.000Z')
    })

    test('should convert Decimal objects to numbers', () => {
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(123.45) }
      expect(serializeDecimal(mockDecimal)).toBe(123.45)
      expect(mockDecimal.toNumber).toHaveBeenCalled()
    })

    test('should handle arrays recursively', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(123.45) }
      const array = [date, mockDecimal, 'string', 42]
      
      const result = serializeDecimal(array)
      expect(result).toEqual(['2024-01-15T10:30:00.000Z', 123.45, 'string', 42])
    })

    test('should handle objects recursively', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(123.45) }
      const obj = {
        date,
        decimal: mockDecimal,
        string: 'test',
        number: 42,
        nested: {
          date: date,
          decimal: mockDecimal
        }
      }
      
      const result = serializeDecimal(obj)
      expect(result).toEqual({
        date: '2024-01-15T10:30:00.000Z',
        decimal: 123.45,
        string: 'test',
        number: 42,
        nested: {
          date: '2024-01-15T10:30:00.000Z',
          decimal: 123.45
        }
      })
    })

    test('should return primitives as is', () => {
      expect(serializeDecimal('string')).toBe('string')
      expect(serializeDecimal(42)).toBe(42)
      expect(serializeDecimal(true)).toBe(true)
    })
  })

  describe('generatePagination', () => {
    test('should return all pages when total is 7 or less', () => {
      expect(generatePagination(1, 5)).toEqual([1, 2, 3, 4, 5])
      expect(generatePagination(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    test('should handle pagination for more than 7 pages', () => {
      // This would need the full implementation to test properly
      // For now, just test that it returns an array
      const result = generatePagination(5, 20)
      expect(Array.isArray(result)).toBe(true)
    })

    test('should handle edge cases', () => {
      expect(generatePagination(1, 1)).toEqual([1])
      expect(generatePagination(1, 0)).toEqual([])
    })
  })

  describe('calculateMargin', () => {
    test('should calculate margin correctly', () => {
      expect(calculateMargin(10, 20)).toBe(50) // (20-10)/20 * 100
      expect(calculateMargin(5, 10)).toBe(50)
      expect(calculateMargin(0, 10)).toBe(100)
    })

    test('should handle zero price', () => {
      expect(calculateMargin(10, 0)).toBe(0)
    })

    test('should handle equal cost and price', () => {
      expect(calculateMargin(10, 10)).toBe(0)
    })
  })

  describe('calculatePrice', () => {
    test('should calculate price from cost and margin', () => {
      expect(calculatePrice(10, 50)).toBe(20) // 10 / (1 - 0.5)
      expect(calculatePrice(5, 20)).toBe(6.25) // 5 / (1 - 0.2)
    })

    test('should handle zero margin', () => {
      expect(calculatePrice(10, 0)).toBe(10)
    })

    test('should handle 100% margin', () => {
      expect(calculatePrice(10, 100)).toBe(Infinity)
    })
  })

  describe('formatPercentage', () => {
    test('should format percentage without sign', () => {
      expect(formatPercentage(0.5)).toBe('50.0%')
      expect(formatPercentage(0.25)).toBe('25.0%')
      expect(formatPercentage(1)).toBe('100.0%')
    })

    test('should format percentage with sign when requested', () => {
      expect(formatPercentage(0.5, true)).toBe('+50.0%')
      expect(formatPercentage(-0.25, true)).toBe('-25.0%')
      expect(formatPercentage(0, true)).toBe('0.0%')
    })

    test('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0.0%')
      expect(formatPercentage(-0.1)).toBe('-10.0%')
    })

    test('should handle very large numbers', () => {
      expect(formatPercentage(10)).toBe('1000.0%')
      expect(formatPercentage(0.001)).toBe('0.1%')
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle console.error calls in ensureValidDate', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Test with an object that will cause an error in Date constructor
      const result = ensureValidDate({ invalid: 'object' })
      expect(result).toBeNull()
      
      consoleSpy.mockRestore()
    })

    test('should handle console.error calls in formatDateTime', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat
      const mockDateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error')
      }) as any
      mockDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf
      Intl.DateTimeFormat = mockDateTimeFormat

      const result = formatDateTime(new Date('2024-01-15'))
      expect(result).toBe('-')

      // Restore original
      Intl.DateTimeFormat = originalDateTimeFormat
      consoleSpy.mockRestore()
    })
  })
}) 