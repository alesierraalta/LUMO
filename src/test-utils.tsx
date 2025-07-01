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
  address: '123 Test Street',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestInventoryItem = (overrides: Partial<any> = {}) => ({
  id: 'test-inventory-id',
  productId: 'test-product-id',
  quantity: 100,
  minStockLevel: 10,
  location: 'Test Location',
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

export const createTestSale = (overrides: Partial<any> = {}) => ({
  id: 'test-sale-id',
  customerId: 'test-customer-id',
  items: [
    {
      productId: 'test-product-id',
      quantity: 2,
      price: 99.99,
      total: 199.98,
    },
  ],
  subtotal: 199.98,
  tax: 20.00,
  total: 219.98,
  status: 'completed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API response helpers
export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

export const createMockApiError = (message = 'API Error', status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
});

// Form helpers
export const fillForm = async (fields: Record<string, string>) => {
  const user = userEvent.setup();
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

export const submitForm = async (formTestId = 'form') => {
  const user = userEvent.setup();
  const form = document.querySelector(`[data-testid="${formTestId}"]`) as HTMLFormElement;
  const submitButton = form?.querySelector('[type="submit"]') as HTMLButtonElement;
  
  if (submitButton) {
    await user.click(submitButton);
  }
};

// Loading helpers
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');
  
  // Wait for common loading indicators to disappear
  const loadingIndicators = [
    () => screen.queryByText('Loading...'),
    () => screen.queryByText('Cargando...'),
    () => screen.queryByText('Guardando...'),
    () => screen.queryByText('Procesando...'),
  ];
  
  for (const getIndicator of loadingIndicators) {
    const indicator = getIndicator();
    if (indicator) {
      await waitForElementToBeRemoved(indicator);
    }
  }
};

// Mock helpers
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(createMockApiResponse(response, status))
  ) as jest.Mock;
};

export const mockFetchError = (message = 'Network Error', status = 500) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(createMockApiError(message, status))
  ) as jest.Mock;
};

export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  return localStorageMock;
};

export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });
  
  return sessionStorageMock;
};

export const mockConsole = () => {
  const originalConsole = { ...console };
  
  const consoleMock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  
  Object.assign(console, consoleMock);
  
  return {
    ...consoleMock,
    restore: () => Object.assign(console, originalConsole),
  };
};

export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  const originalDate = Date;
  
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.now = jest.fn(() => mockDate.getTime());
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;
  
  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.IntersectionObserver = mockIntersectionObserver;
  window.IntersectionObserverEntry = jest.fn();
  
  return mockIntersectionObserver;
};

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

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };

// Add a simple test to prevent Jest from failing
describe('Test Utils', () => {
  it('should export testing utilities', () => {
    expect(customRender).toBeDefined();
    expect(createTestUser).toBeDefined();
    expect(createTestProduct).toBeDefined();
    expect(mockFetch).toBeDefined();
  });
});

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
  createTestInventoryItem,
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