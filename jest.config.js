const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Module name mapping for absolute imports and assets
  moduleNameMapper: {
    // Handle module aliases (if you use them in your Next.js app)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/test-utils$': '<rootDir>/src/__tests__/utils/test-utils',
    
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle image and asset imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/middleware.ts',
    '!src/app/globals.css',
    '!src/app/layout.tsx',
    '!**/node_modules/**',
    // Exclude specific files that don't need coverage
    '!src/lib/choreo-*',
    '!src/lib/prisma-monkey-patch.*',
    '!src/lib/runtime-p6001-patch.ts',
  ],
  
  // Enhanced coverage thresholds for comprehensive testing
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical components
    'src/components/auth/**/*.{js,jsx,ts,tsx}': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/components/inventory/**/*.{js,jsx,ts,tsx}': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/lib/utils.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Test patterns - prioritize unit tests
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/scripts/',
    '<rootDir>/e2e/',
    '<rootDir>/performance/',
    '<rootDir>/src/__tests__/integration/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/src/__tests__/performance/',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Transform node_modules that use ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@noble|@paralleldrive|@testing-library)/)',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Verbose output for better debugging
  verbose: true,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Enhanced test timeout for complex component tests
  testTimeout: 10000,
  
  // Collect coverage from all files by default
  collectCoverage: false,
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Global setup for React Testing Library
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  
  // Error handling
  errorOnDeprecated: true,
  
  // Notify mode for watch
  notify: false,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 