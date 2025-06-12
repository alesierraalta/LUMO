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

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('utils.ts', () => {
  describe('cn', () => {
    test('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    test('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    test('should handle Tailwind conflicts', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    test('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    test('should handle null and undefined', () => {
      expect(cn('base', null, undefined, 'end')).toBe('base end')
    })
  })

  describe('getApiBaseUrl', () => {
    test('should return NEXT_PUBLIC_API_URL when set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/'
      expect(getApiBaseUrl()).toBe('https://api.example.com')
    })

    test('should remove trailing slash from NEXT_PUBLIC_API_URL', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/'
      expect(getApiBaseUrl()).toBe('https://api.example.com')
    })

    test('should return Vercel URL when NEXT_PUBLIC_API_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      process.env.VERCEL_URL = 'myapp.vercel.app'
      expect(getApiBaseUrl()).toBe('https://myapp.vercel.app')
    })

    test('should return localhost in development when no URLs are set', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      delete process.env.VERCEL_URL
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      expect(getApiBaseUrl()).toBe('http://localhost:3000')
    })

    test('should return empty string in production when no URLs are set', () => {
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

    test('should return null for null input', () => {
      expect(ensureValidDate(null)).toBeNull()
    })

    test('should return null for undefined input', () => {
      expect(ensureValidDate(undefined)).toBeNull()
    })

    test('should return null for empty object', () => {
      expect(ensureValidDate({})).toBeNull()
    })

    test('should parse valid date string', () => {
      const result = ensureValidDate('2024-01-15T12:00:00Z')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(0) // January is 0
    })

    test('should return null for invalid date string', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      expect(ensureValidDate('invalid-date')).toBeNull()
      consoleSpy.mockRestore()
    })

    test('should handle numeric timestamp', () => {
      const timestamp = Date.now()
      const result = ensureValidDate(timestamp)
      expect(result).toBeInstanceOf(Date)
    })

    test('should return null for invalid input and log error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      expect(ensureValidDate('completely-invalid-date-string')).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('formatDate', () => {
    test('should format valid date', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const result = formatDate(date)
      // Check that it contains the expected date parts
      expect(result).toContain('2024')
      expect(result).toContain('01')
      expect(result).toContain('15')
    })

    test('should return fallback for null date', () => {
      expect(formatDate(null)).toBe('-')
    })

    test('should return custom fallback', () => {
      expect(formatDate(null, 'N/A')).toBe('N/A')
    })

    test('should handle string date input', () => {
      const result = formatDate('2024-01-15T12:00:00Z')
      // Check that it contains the expected date parts
      expect(result).toContain('2024')
      expect(result).toContain('01')
      expect(result).toContain('15')
    })

    test('should return fallback for invalid date', () => {
      expect(formatDate('invalid')).toBe('-')
    })

    test('should handle formatting errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat
      const mockDateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error')
      }) as any
      mockDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf
      Intl.DateTimeFormat = mockDateTimeFormat

      expect(formatDate(new Date())).toBe('-')
      expect(consoleSpy).toHaveBeenCalled()

      Intl.DateTimeFormat = originalDateTimeFormat
      consoleSpy.mockRestore()
    })
  })

  describe('formatDateTime', () => {
    test('should format valid date with time', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/15\/01\/2024.*10:30/)
    })

    test('should return fallback for null date', () => {
      expect(formatDateTime(null)).toBe('-')
    })

    test('should return custom fallback', () => {
      expect(formatDateTime(null, 'N/A')).toBe('N/A')
    })

    test('should handle formatting errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat
      const mockDateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error')
      }) as any
      mockDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf
      Intl.DateTimeFormat = mockDateTimeFormat

      expect(formatDateTime(new Date())).toBe('-')
      expect(consoleSpy).toHaveBeenCalled()

      Intl.DateTimeFormat = originalDateTimeFormat
      consoleSpy.mockRestore()
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
    test('should format number as MXN currency', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    test('should format string number as currency', () => {
      expect(formatCurrency('100.50')).toBe('$100.50')
    })

    test('should return $0.00 for null', () => {
      expect(formatCurrency(null)).toBe('$0.00')
    })

    test('should return $0.00 for undefined', () => {
      expect(formatCurrency(undefined)).toBe('$0.00')
    })

    test('should return $0.00 for NaN string', () => {
      expect(formatCurrency('invalid')).toBe('$0.00')
    })

    test('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    test('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-$50.00')
    })
  })

  describe('serializeDecimal', () => {
    test('should return null/undefined as is', () => {
      expect(serializeDecimal(null)).toBeNull()
    })

    test('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      expect(serializeDecimal(date)).toBe('2024-01-15T10:30:00.000Z')
    })

    test('should convert Decimal object to number', () => {
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(123.45) }
      expect(serializeDecimal(mockDecimal)).toBe(123.45)
      expect(mockDecimal.toNumber).toHaveBeenCalled()
    })

    test('should handle arrays recursively', () => {
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(100) }
      const array = [1, mockDecimal, 'string']
      const result = serializeDecimal(array)
      
      expect(result).toEqual([1, 100, 'string'])
    })

    test('should handle objects recursively', () => {
      const mockDecimal = { toNumber: jest.fn().mockReturnValue(50) }
      const obj = {
        id: 1,
        price: mockDecimal,
        name: 'test',
        nested: {
          value: mockDecimal
        }
      }
      
      const result = serializeDecimal(obj)
      expect(result).toEqual({
        id: 1,
        price: 50,
        name: 'test',
        nested: {
          value: 50
        }
      })
    })

    test('should return primitives as is', () => {
      expect(serializeDecimal(123)).toBe(123)
      expect(serializeDecimal('string')).toBe('string')
      expect(serializeDecimal(true)).toBe(true)
    })
  })

  describe('generatePagination', () => {
    test('should return all pages when total is 7 or less', () => {
      expect(generatePagination(3, 5)).toEqual([1, 2, 3, 4, 5])
      expect(generatePagination(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    test('should handle first 3 pages', () => {
      expect(generatePagination(1, 10)).toEqual([1, 2, 3, 4, '...', 9, 10])
      expect(generatePagination(2, 10)).toEqual([1, 2, 3, 4, '...', 9, 10])
      expect(generatePagination(3, 10)).toEqual([1, 2, 3, 4, '...', 9, 10])
    })

    test('should handle last 3 pages', () => {
      expect(generatePagination(8, 10)).toEqual([1, 2, '...', 7, 8, 9, 10])
      expect(generatePagination(9, 10)).toEqual([1, 2, '...', 7, 8, 9, 10])
      expect(generatePagination(10, 10)).toEqual([1, 2, '...', 7, 8, 9, 10])
    })

    test('should handle middle pages', () => {
      expect(generatePagination(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
      expect(generatePagination(6, 12)).toEqual([1, '...', 5, 6, 7, '...', 12])
    })
  })

  describe('calculateMargin', () => {
    test('should calculate margin correctly', () => {
      expect(calculateMargin(100, 150)).toBe(50)
      expect(calculateMargin(50, 75)).toBe(50)
    })

    test('should handle string inputs', () => {
      expect(calculateMargin(Number('100'), Number('150'))).toBe(50)
    })

    test('should return 0 for zero or negative cost', () => {
      expect(calculateMargin(0, 100)).toBe(0)
      expect(calculateMargin(-10, 100)).toBe(0)
    })

    test('should return 0 for zero or negative price', () => {
      expect(calculateMargin(100, 0)).toBe(0)
      expect(calculateMargin(100, -50)).toBe(0)
    })

    test('should handle invalid inputs', () => {
      expect(calculateMargin(NaN, 100)).toBe(0)
      expect(calculateMargin(100, NaN)).toBe(0)
    })
  })

  describe('calculatePrice', () => {
    test('should calculate price correctly', () => {
      expect(calculatePrice(100, 50)).toBe(150)
      expect(calculatePrice(200, 25)).toBe(250)
    })

    test('should handle string inputs', () => {
      expect(calculatePrice(Number('100'), Number('50'))).toBe(150)
    })

    test('should return 0 for zero or negative cost', () => {
      expect(calculatePrice(0, 50)).toBe(0)
      expect(calculatePrice(-10, 50)).toBe(0)
    })

    test('should return cost when margin is zero or negative', () => {
      expect(calculatePrice(100, 0)).toBe(100)
      expect(calculatePrice(100, -10)).toBe(100)
    })

    test('should handle invalid inputs', () => {
      expect(calculatePrice(NaN, 50)).toBe(0)
      expect(calculatePrice(100, NaN)).toBe(100)
    })
  })

  describe('formatPercentage', () => {
    test('should format positive percentage', () => {
      expect(formatPercentage(25.5)).toBe('25.50%')
    })

    test('should format negative percentage', () => {
      expect(formatPercentage(-15.75)).toBe('15.75%')
    })

    test('should format with sign when requested', () => {
      expect(formatPercentage(25.5, true)).toBe('+25.50%')
      expect(formatPercentage(-15.75, true)).toBe('15.75%')
    })

    test('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%')
      expect(formatPercentage(0, true)).toBe('0.00%')
    })

    test('should format to 2 decimal places', () => {
      expect(formatPercentage(33.333333)).toBe('33.33%')
    })
  })
}) 