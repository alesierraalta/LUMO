// Test utilities for React Testing Library with custom providers
import { render, RenderOptions } from '@testing-library/react'

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@lumo.dev',
  role: 'USER',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  ...overrides,
})

export const createMockInventoryItem = (overrides = {}) => ({
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
  ...overrides,
})

export const createMockCategory = (overrides = {}) => ({
  id: '1',
  name: 'Test Category',
  description: 'Test Category Description',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  ...overrides,
})

export const createMockLocation = (overrides = {}) => ({
  id: '1',
  name: 'Test Location',
  description: 'Test Location Description',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  ...overrides,
})

export const createMockSale = (overrides = {}) => ({
  id: '1',
  total: 100.00,
  subtotal: 85.00,
  tax: 15.00,
  discount: 0.00,
  status: 'completed',
  paymentMethod: 'cash',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  items: [],
  ...overrides,
})

// Helper to wait for loading states to resolve
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock fetch responses
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: async () => response,
    text: async () => JSON.stringify(response),
  })
}

// Helper to mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
}) 