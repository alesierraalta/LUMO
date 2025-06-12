// Jest setup for integration tests (Node.js environment)
import { jest } from '@jest/globals'

// Set test timeout
jest.setTimeout(30000)

// Mock console to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
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