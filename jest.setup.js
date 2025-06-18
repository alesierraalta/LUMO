// Jest setup file for React Testing Library and global test configuration

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Setup Supabase environment variables for tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

// Import jest-dom custom matchers
import '@testing-library/jest-dom'

// Global test environment setup
global.console = {
  ...console,
  // Optionally disable console.log in tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window-related objects only in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock window.location
  delete window.location
  window.location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  }

  // Mock window.scrollTo
  window.scrollTo = jest.fn()

  // Mock localStorage
  window.localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: window.localStorageMock
  })

  // Mock sessionStorage
  window.sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: window.sessionStorageMock
  })

  // Mock HTMLCanvasElement.getContext for charts/canvas elements
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = jest.fn()
  }
}

// Increase timeout for async tests
jest.setTimeout(10000)

// Global test utilities
export const testUtils = {
  // Reset all mocks before each test
  resetMocks: () => {
    jest.clearAllMocks()
    if (typeof window !== 'undefined' && window.localStorageMock) {
      window.localStorageMock.getItem.mockClear()
      window.localStorageMock.setItem.mockClear()
      window.localStorageMock.removeItem.mockClear()
      window.localStorageMock.clear.mockClear()
    }
    if (typeof window !== 'undefined' && window.sessionStorageMock) {
      window.sessionStorageMock.getItem.mockClear()
      window.sessionStorageMock.setItem.mockClear()
      window.sessionStorageMock.removeItem.mockClear()
      window.sessionStorageMock.clear.mockClear()
    }
  },
  
  // Mock user data for tests
  mockUser: {
    id: '1',
    email: 'test@lumo.dev',
    role: 'USER',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  
  // Mock admin user data for tests
  mockAdminUser: {
    id: '2',
    email: 'admin@lumo.dev',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  
  // Mock inventory item for tests
  mockInventoryItem: {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    sku: 'TEST-001',
    barcode: '1234567890',
    quantity: 100,
    minLevel: 10,
    cost: 10.00,
    price: 20.00,
    categoryId: '1',
    locationId: '1',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  
  // Mock category for tests
  mockCategory: {
    id: '1',
    name: 'Test Category',
    description: 'Test Category Description',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  
  // Mock location for tests
  mockLocation: {
    id: '1',
    name: 'Test Location',
    description: 'Test Location Description',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  
  // Mock Supabase JWT token for tests
  mockSupabaseToken: 'lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==',
}

// Reset mocks before each test
beforeEach(() => {
  testUtils.resetMocks()
}) 