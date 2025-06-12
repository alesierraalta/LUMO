# 🔬 Unit Testing Guide

## Overview

Unit testing in LUMO focuses on testing individual components, hooks, and utility functions in isolation. We use Jest and React Testing Library to ensure components behave correctly under various conditions.

## 🎯 What We Test

### React Components
- Rendering behavior
- User interactions
- Props handling
- State changes
- Error boundaries

### Custom Hooks
- State management
- Side effects
- Return values
- Error handling

### Utility Functions
- Input/output validation
- Edge cases
- Error conditions
- Performance

## 🛠️ Tools and Setup

### Dependencies
```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.6.1",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.14"
}
```

### Configuration
- **Environment**: jsdom (browser simulation)
- **Setup**: `jest.setup.js` with global mocks
- **Module mapping**: Handles CSS and asset imports

## 📝 Writing Unit Tests

### Component Testing Pattern

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Hook Testing Pattern

```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuthContext: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false
  })
}));

describe('useAuth', () => {
  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('handles login correctly', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    
    // Update mock implementation
    jest.mocked(useAuthContext).mockReturnValue({
      user: null,
      login: mockLogin,
      logout: jest.fn(),
      isLoading: false
    });

    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });
});
```

### Utility Function Testing

```javascript
import { formatCurrency, calculateDiscount } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });

  it('handles edge cases', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
    expect(formatCurrency(NaN)).toBe('$0.00');
  });
});

describe('calculateDiscount', () => {
  it('calculates percentage discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
    expect(calculateDiscount(50, 25)).toBe(37.5);
  });

  it('handles zero and negative values', () => {
    expect(calculateDiscount(0, 10)).toBe(0);
    expect(calculateDiscount(100, 0)).toBe(100);
    expect(calculateDiscount(-100, 10)).toBe(-100);
  });

  it('throws error for invalid percentage', () => {
    expect(() => calculateDiscount(100, -5)).toThrow('Invalid discount percentage');
    expect(() => calculateDiscount(100, 101)).toThrow('Invalid discount percentage');
  });
});
```

## 🎭 Mocking Strategies

### External Dependencies

```javascript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test-path'
}));

// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchProducts: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn()
}));
```

### Component Dependencies

```javascript
// Mock child components
jest.mock('@/components/ui/button', () => {
  return function MockButton({ children, onClick, ...props }) {
    return (
      <button onClick={onClick} data-testid="mock-button" {...props}>
        {children}
      </button>
    );
  };
});
```

### Context Providers

```javascript
// Create test wrapper for context
const TestWrapper = ({ children }) => (
  <AuthProvider value={mockAuthValue}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
);

// Use in tests
render(<ComponentUnderTest />, { wrapper: TestWrapper });
```

## 🔍 Testing Patterns

### Error Boundaries

```javascript
import { ErrorBoundary } from '@/components/error-boundary';

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('catches and displays error', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
```

### Async Operations

```javascript
describe('AsyncComponent', () => {
  it('shows loading state then data', async () => {
    const mockData = { id: 1, name: 'Test Product' };
    jest.mocked(fetchProduct).mockResolvedValue(mockData);
    
    render(<ProductDetails productId="1" />);
    
    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // Ensure loading is gone
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

### Form Validation

```javascript
describe('ProductForm validation', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<ProductForm onSubmit={jest.fn()} />);
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/price is required/i)).toBeInTheDocument();
    });
  });

  it('validates price format', async () => {
    const user = userEvent.setup();
    render(<ProductForm onSubmit={jest.fn()} />);
    
    await user.type(screen.getByLabelText(/price/i), 'invalid-price');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/invalid price format/i)).toBeInTheDocument();
    });
  });
});
```

## 📊 Coverage Guidelines

### Target Coverage
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Running Coverage

```bash
# Generate coverage report
npm run test:unit -- --coverage

# Coverage with threshold enforcement
npm run test:unit -- --coverage --coverageThreshold='{"global":{"statements":80,"branches":75,"functions":80,"lines":80}}'

# Open coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

## 🚀 Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
test('should calculate total price with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;
  
  // Act
  const total = calculateTotalWithTax(items, taxRate);
  
  // Assert
  expect(total).toBe(330);
});
```

### 2. Descriptive Test Names
```javascript
// ✅ Good
it('should display error message when email is invalid')
it('should call onSubmit when form is valid and submitted')
it('should disable submit button when form is submitting')

// ❌ Avoid
it('should work correctly')
it('should handle input')
it('should test the component')
```

### 3. Test One Thing at a Time
```javascript
// ✅ Good - Single responsibility
it('should validate email format', () => {
  // Test only email validation
});

it('should validate password length', () => {
  // Test only password validation
});

// ❌ Avoid - Multiple responsibilities
it('should validate form', () => {
  // Tests email, password, and submission
});
```

### 4. Use Data-Testid Sparingly
```javascript
// ✅ Prefer semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email address/i)
screen.getByText(/welcome back/i)

// ⚠️ Use data-testid only when necessary
screen.getByTestId('complex-component-part')
```

### 5. Clean Up After Tests
```javascript
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // React Testing Library cleanup
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

## 🐛 Common Issues and Solutions

### 1. Act Warnings
```javascript
// ❌ Causes act warning
fireEvent.click(button);
expect(screen.getByText('Updated')).toBeInTheDocument();

// ✅ Proper async handling
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 2. Timer Mocks
```javascript
describe('Component with timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should update after delay', () => {
    render(<DelayedComponent />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});
```

### 3. Module Mocking
```javascript
// Mock before importing the component
jest.mock('@/lib/api');

// Type the mock for TypeScript
const mockApi = jest.mocked(api);

// Reset mocks between tests
beforeEach(() => {
  mockApi.fetchData.mockReset();
});
```

## 📚 Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Next**: [Integration Testing Guide](./INTEGRATION_TESTING.md) 