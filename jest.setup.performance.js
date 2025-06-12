// Jest setup file for Performance Testing (Node.js environment)

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Import jest-dom custom matchers (only the ones that work in Node.js)
import '@testing-library/jest-dom'

// Global test environment setup for Node.js
global.console = {
  ...console,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage for Node.js environment
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Increase timeout for performance tests
jest.setTimeout(30000)

// Global test utilities for performance testing
export const performanceTestUtils = {
  // Reset all mocks before each test
  resetMocks: () => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()
    sessionStorageMock.clear.mockClear()
  },
  
  // Performance measurement utilities
  measurePerformance: async (operation) => {
    const startTime = process.hrtime.bigint()
    await operation()
    const endTime = process.hrtime.bigint()
    return Number(endTime - startTime) / 1000000 // Convert to milliseconds
  },
  
  // Memory measurement utilities
  measureMemory: (operation) => {
    const initialMemory = process.memoryUsage()
    operation()
    const finalMemory = process.memoryUsage()
    return {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external,
      rss: finalMemory.rss - initialMemory.rss,
    }
  },
  
  // Performance thresholds
  thresholds: {
    simpleQuery: 100, // ms
    complexQuery: 500, // ms
    bulkOperation: 1000, // ms
    memoryIncrease: 50 * 1024 * 1024, // 50MB
    operationsPerSecond: 1000,
    errorRate: 0.05, // 5%
  },
}

// Reset mocks before each test
beforeEach(() => {
  performanceTestUtils.resetMocks()
}) 