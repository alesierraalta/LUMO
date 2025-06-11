// Jest setup file for React Testing Library and global test configuration

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
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock HTMLCanvasElement.getContext for charts/canvas elements
HTMLCanvasElement.prototype.getContext = jest.fn()

// Increase timeout for async tests
jest.setTimeout(10000)

// Global test utilities
export const testUtils = {
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
}

// Reset mocks before each test
beforeEach(() => {
  testUtils.resetMocks()
}) 