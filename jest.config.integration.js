const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Integration test configuration with Node.js environment
const integrationJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  
  // Use Node.js environment for integration tests
  testEnvironment: 'node',
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  
  // Integration test patterns
  testMatch: [
    '<rootDir>/src/__tests__/integration/**/*.test.{js,ts}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/scripts/',
    '<rootDir>/e2e/',
    '<rootDir>/performance/',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Timeout for integration tests
  testTimeout: 30000,
}

module.exports = createJestConfig(integrationJestConfig) 