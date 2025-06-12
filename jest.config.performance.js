const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.performance.js'],
  testEnvironment: 'node', // Use Node environment for performance tests
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Only run performance tests
  testMatch: [
    '<rootDir>/src/__tests__/performance/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Don't ignore performance tests
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/scripts/',
    '<rootDir>/e2e/',
  ],
  
  // Performance-specific settings
  verbose: true,
  maxWorkers: 1, // Run performance tests sequentially
  testTimeout: 30000, // Longer timeout for performance tests
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@noble|@paralleldrive)/)',
  ],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(customJestConfig) 