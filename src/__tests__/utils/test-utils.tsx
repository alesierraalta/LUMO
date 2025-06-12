/**
 * 🧪 LUMO Testing Utilities
 * 
 * Comprehensive testing utilities for React components, hooks, and utilities.
 * Provides custom render functions, mock providers, and test data factories.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Mock useRouter hook
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock authentication context
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refreshUser: jest.fn(),
  hasPermission: jest.fn(() => false),
  hasRole: jest.fn(() => false),
};

// Mock auth provider
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Auth options
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  } | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  
  // Theme options
  theme?: 'light' | 'dark' | 'system';
  
  // Router options
  router?: Partial<typeof mockRouter>;
}

function AllTheProviders({
  children,
  user = null,
  isAuthenticated = false,
  isLoading = false,
  theme = 'light',
  router = {},
}: {
  children: ReactNode;
} & CustomRenderOptions) {
  // Update mock router with custom options
  Object.assign(mockRouter, router);
  
  // Update mock auth context
  Object.assign(mockAuthContext, {
    user,
    isAuthenticated,
    isLoading,
    hasPermission: jest.fn((permission: string) => 
      user?.permissions?.includes(permission) || false
    ),
    hasRole: jest.fn((role: string) => user?.role === role),
  });

  return (
    <ThemeProvider attribute="class" defaultTheme={theme}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </ThemeProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { user, isAuthenticated, isLoading, theme, router, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        theme={theme}
        router={router}
      />
    ),
    ...renderOptions,
  });
};

// Test data factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  permissions: ['read:products', 'write:products'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestAdmin = (overrides: Partial<any> = {}) => ({
  id: 'test-admin-id',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
  permissions: [
    'read:products',
    'write:products',
    'delete:products',
    'read:users',
    'write:users',
    'read:reports',
    'write:reports',
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestProduct = (overrides: Partial<any> = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'A test product for testing purposes',
  sku: 'TEST-001',
  price: 99.99,
  cost: 50.00,
  stock: 100,
  minStockLevel: 10,
  categoryId: 'test-category-id',
  locationId: 'test-location-id',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestCategory = (overrides: Partial<any> = {}) => ({
  id: 'test-category-id',
  name: 'Test Category',
  description: 'A test category for testing purposes',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestLocation = (overrides: Partial<any> = {}) => ({
  id: 'test-location-id',
  name: 'Test Location',
  description: 'A test location for testing purposes',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestSale = (overrides: Partial<any> = {}) => ({
  id: 'test-sale-id',
  total: 199.98,
  subtotal: 199.98,
  tax: 0,
  discount: 0,
  status: 'completed',
  customerId: 'test-customer-id',
  userId: 'test-user-id',
  items: [
    {
      id: 'test-sale-item-id',
      productId: 'test-product-id',
      quantity: 2,
      price: 99.99,
      total: 199.98,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

export const createMockApiError = (message = 'API Error', status = 500) => ({
  ok: false,
  status,
  statusText: 'Error',
  json: jest.fn().mockResolvedValue({ error: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ error: message })),
});

// Form testing utilities
export const fillForm = async (fields: Record<string, string>) => {
  const user = userEvent.setup();
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

export const submitForm = async (formTestId = 'form') => {
  const user = userEvent.setup();
  const form = document.querySelector(`[data-testid="${formTestId}"]`) as HTMLElement;
  const submitButton = form?.querySelector('button[type="submit"]') as HTMLElement;
  
  if (submitButton) {
    await user.click(submitButton);
  }
};

// Wait utilities
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  
  try {
    await waitForElementToBeRemoved(
      () => document.querySelector('[data-testid="loading"]'),
      { timeout: 3000 }
    );
  } catch (error) {
    // Loading element might not exist, which is fine
  }
};

// Mock fetch for API testing
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue(
    createMockApiResponse(response, status)
  );
};

export const mockFetchError = (message = 'Network Error', status = 500) => {
  global.fetch = jest.fn().mockRejectedValue(
    new Error(message)
  );
};

// Local storage mock
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  return localStorageMock;
};

// Session storage mock
export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });
  
  return sessionStorageMock;
};

// Console mock utilities
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  
  return {
    restore: () => {
      Object.assign(console, originalConsole);
    },
  };
};

// Date mock utilities
export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  const originalDate = Date;
  
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.now = jest.fn(() => mockDate.getTime());
  
  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
};

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.IntersectionObserver = mockIntersectionObserver;
  
  return mockIntersectionObserver;
};

// Resize Observer mock
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.ResizeObserver = mockResizeObserver;
  
  return mockResizeObserver;
};

// Export everything
export * from '@testing-library/react';
export { customRender as render, userEvent, mockRouter, mockAuthContext };

// Default export for convenience
export default {
  render: customRender,
  userEvent,
  mockRouter,
  mockAuthContext,
  createTestUser,
  createTestAdmin,
  createTestProduct,
  createTestCategory,
  createTestLocation,
  createTestSale,
  createMockApiResponse,
  createMockApiError,
  fillForm,
  submitForm,
  waitForLoadingToFinish,
  mockFetch,
  mockFetchError,
  mockLocalStorage,
  mockSessionStorage,
  mockConsole,
  mockDate,
  mockIntersectionObserver,
  mockResizeObserver,
}; 