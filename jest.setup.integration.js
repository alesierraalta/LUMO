// Jest setup for integration tests (Node.js environment)
import { jest } from '@jest/globals'

// Set test timeout
jest.setTimeout(30000)

// Mock console to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Reset mock database before each test
  try {
    const { resetMockDatabase } = require('./src/__mocks__/@supabase/supabase-js.js')
    if (resetMockDatabase) {
      resetMockDatabase()
    }
  } catch (error) {
    // Ignore if mock is not available (e.g., in unit tests)
  }
  
  // Suppress known console errors during tests
  console.error = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
       message.includes('Warning: React.createFactory is deprecated'))
    ) {
      return
    }
    originalConsoleError(message)
  })
  
  console.warn = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      message.includes('Deprecated')
    ) {
      return
    }
    originalConsoleWarn(message)
  })
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  jest.clearAllMocks()
})

// Global test environment setup
global.testConfig = {
  databaseUrl: process.env.DATABASE_URL || 'file:./test-integration.db',
  jwtSecret: process.env.JWT_SECRET || 'test-secret-key',
}

// Export for use in tests
export { jest } 